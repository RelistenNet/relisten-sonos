import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatId, parseId } from '../src/ids.js';
import buildServices from '../src/smapi/services.js';
import type { SmapiArgs, SmapiCallback } from '../src/smapi/types.js';

const trackId = 'track_4rc5e1za2bvsrnnr0edzzj8rfs';
const uuidId = `TrackU:${trackId}`;
const legacyAlbumId = 'Show:grateful-dead:1977:1977-05-08:4152204';
const legacyId = 'Track:grateful-dead:1977:1977-05-08:4152204:5182438';
const v4TrackPath = `/api/v4/source-tracks/${trackId}`;
const v4Track = {
  id: trackId,
  source_id: 'source_7bbw2e16a0h9ssczd3bwzgv1wp',
  artist_id: 'artist_3qmp7zjbg1rpebhtyfy43096vj',
  title: 'Minglewood Blues',
  duration: 381,
  mp3_url: 'https://archive.org/download/tape/Minglewood Blues.mp3',
  flac_url: null,
};
const v4ArtistPath = `/api/v4/artists/${v4Track.artist_id}`;
const v4SourcePath = `/api/v4/sources/${v4Track.source_id}`;
const artist = { slug: 'grateful-dead', name: 'Grateful Dead' };
const source = { display_date: '1977-05-08', imported_venue: { name: 'Barton Hall' } };
const proxiedMp3 =
  'https://audio-bare.relisten.net/archive.org/download/tape/Minglewood%20Blues.mp3';

const mp3 = buildServices({ format: 'mp3' }).Sonos.SonosSoap;
const flac = buildServices({ format: 'flac' }).Sonos.SonosSoap;
const call = (handler: (args: SmapiArgs, callback: SmapiCallback) => void, args: SmapiArgs) =>
  new Promise((resolve) => handler(args, resolve));

const fixtureFetch =
  (fixtures: Record<string, unknown>) => async (input: string | URL, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).has('authorization'), false);
    const path = new URL(input).pathname;
    assert.ok(Object.hasOwn(fixtures, path), `Unexpected catalog read: ${path}`);
    return Response.json(fixtures[path]);
  };

test('accepts and round-trips canonical UUID and numeric track IDs', () => {
  assert.deepEqual(parseId(uuidId), { kind: 'uuidTrack', trackId });
  for (const id of [legacyId, uuidId]) {
    const parsed = parseId(id);
    assert.ok(parsed);
    assert.equal(formatId(parsed), id);
  }

  for (const id of [
    'TrackU:98615c1f-a84b-de71-5ae0-0e6fff2461f9',
    uuidId.replace('track_', 'show_'),
    uuidId.replace('track_4', 'track_8'),
    uuidId.toUpperCase().replace('TRACKU:', 'TrackU:'),
    `${uuidId}:123`,
    `${uuidId}/..`,
  ]) {
    assert.equal(parseId(id), null, id);
  }
});

test('numeric browse still emits the legacy ID and that ID resolves as a saved track', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    fixtureFetch({
      '/api/v2/artists': [artist],
      '/api/v2/artists/grateful-dead/years/1977/1977-05-08': {
        display_date: source.display_date,
        venue: source.imported_venue,
        sources: [
          {
            id: 4152204,
            sets: [{ tracks: [{ ...v4Track, id: 5182438 }] }],
          },
        ],
      },
    })
  );

  const browse = await call(mp3.getMetadata, { id: legacyAlbumId, index: 0, count: 10 });
  assert.partialDeepStrictEqual(browse, {
    getMetadataResult: { mediaMetadata: [{ id: legacyId }] },
  });
  assert.partialDeepStrictEqual(await call(mp3.getMediaMetadata, { id: legacyId }), {
    getMediaMetadataResult: {
      id: legacyId,
      trackMetadata: { albumId: legacyAlbumId, artist: artist.name },
    },
  });
  assert.deepEqual(await call(mp3.getMediaURI, { id: legacyId }), {
    getMediaURIResult: proxiedMp3,
    httpHeaders: [],
  });
});

test('UUID playback and metadata use the public V4 catalog with MP3 fallback', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    fixtureFetch({
      [v4TrackPath]: v4Track,
      [v4ArtistPath]: artist,
      [v4SourcePath]: source,
    })
  );

  assert.deepEqual(await call(flac.getMediaURI, { id: uuidId }), {
    getMediaURIResult: proxiedMp3,
    httpHeaders: [],
  });
  const metadata = {
    id: uuidId,
    itemType: 'track',
    title: 'Minglewood Blues',
    mimeType: 'audio/mp3',
    trackMetadata: {
      album: '1977-05-08 Barton Hall',
      artistId: 'Artist:grateful-dead',
      artist: 'Grateful Dead',
      duration: 381,
      canPlay: true,
    },
  };
  assert.partialDeepStrictEqual(await call(flac.getMediaMetadata, { id: uuidId }), {
    getMediaMetadataResult: metadata,
  });
  assert.partialDeepStrictEqual(await call(flac.getExtendedMetadata, { id: uuidId }), {
    getExtendedMetadataResult: { mediaMetadata: metadata },
  });
});

test('UUID playback uses the artist slug for Phish proxying and honors FLAC', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    fixtureFetch({
      [v4TrackPath]: {
        ...v4Track,
        mp3_url: 'https://phish.in/tape.mp3',
        flac_url: 'https://phish.in/tape.flac',
      },
      [v4ArtistPath]: { slug: 'phish', name: 'Phish' },
      [v4SourcePath]: source,
    })
  );

  assert.partialDeepStrictEqual(await call(mp3.getMediaURI, { id: uuidId }), {
    getMediaURIResult: 'https://audio-bare.relisten.net/phish.in/tape.mp3',
  });
  assert.partialDeepStrictEqual(await call(flac.getMediaURI, { id: uuidId }), {
    getMediaURIResult: 'https://audio-bare.relisten.net/phish.in/tape.flac',
  });
  assert.partialDeepStrictEqual(await call(flac.getMediaMetadata, { id: uuidId }), {
    getMediaMetadataResult: { mimeType: 'audio/flac' },
  });
});

test('unknown UUID tracks return empty results and malformed IDs skip the catalog', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', (input: string) => {
    assert.equal(new URL(input).pathname, v4TrackPath);
    return new Response(null, { status: 404 });
  });

  assert.deepEqual(await call(mp3.getMediaURI, { id: uuidId }), { getMediaURIResult: '' });
  assert.deepEqual(await call(mp3.getMediaMetadata, { id: uuidId }), {
    getMediaMetadataResult: {},
  });
  assert.equal(fetch.mock.callCount(), 2);

  const malformedId = `${uuidId}:extra`;
  assert.deepEqual(await call(mp3.getMediaURI, { id: malformedId }), { getMediaURIResult: '' });
  assert.deepEqual(await call(mp3.getMediaMetadata, { id: malformedId }), {
    getMediaMetadataResult: {},
  });
  assert.equal(fetch.mock.callCount(), 2);
});

test('known UUID tracks without audio return metadata marked unplayable and no URI', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    fixtureFetch({
      [v4TrackPath]: { ...v4Track, mp3_url: null, flac_url: null, duration: null },
      [v4ArtistPath]: artist,
      [v4SourcePath]: source,
    })
  );

  assert.deepEqual(await call(flac.getMediaURI, { id: uuidId }), { getMediaURIResult: '' });
  assert.partialDeepStrictEqual(await call(flac.getMediaMetadata, { id: uuidId }), {
    getMediaMetadataResult: {
      id: uuidId,
      title: v4Track.title,
      trackMetadata: { duration: undefined, canPlay: false },
    },
  });
});
