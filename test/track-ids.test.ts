import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { after, before, beforeEach, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { listen } from 'soap';
import { formatId, parseId } from '../src/ids.js';

const trackId = 'track_4rc5e1za2bvsrnnr0edzzj8rfs';
const uuidId = `TrackU:${trackId}`;
const albumId = 'Show:grateful-dead:1977:1977-05-08:4152204';
const legacyId = 'Track:grateful-dead:1977:1977-05-08:4152204:5182438';
const track = {
  id: trackId,
  source_id: 'source_7bbw2e16a0h9ssczd3bwzgv1wp',
  artist_id: 'artist_3qmp7zjbg1rpebhtyfy43096vj',
  title: 'Minglewood Blues',
  duration: 381,
  mp3_url: 'https://archive.org/download/tape/Minglewood%20Blues.mp3',
  flac_url: null,
};
const trackPath = `/api/v4/source-tracks/${trackId}`;
const artistPath = `/api/v4/artists/${track.artist_id}`;
const sourcePath = `/api/v4/sources/${track.source_id}`;
const artist = { slug: 'grateful-dead', name: 'Grateful Dead' };
const source = { display_date: '1977-05-08', imported_venue: { name: 'Barton Hall' } };
const proxiedMp3 =
  'https://audio-bare.relisten.net/archive.org/download/tape/Minglewood%20Blues.mp3';

let soapOrigin: string;
const routes = new Map<string, object | number>();
const requests: { url: string | undefined; authorization: string | undefined }[] = [];
const catalogServer = createServer((req, res) => {
  requests.push({ url: req.url, authorization: req.headers.authorization });
  const result = routes.get(req.url ?? '') ?? 500;
  if (typeof result === 'number') {
    res.writeHead(result).end();
  } else {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result));
  }
});
const soapServer = createServer();

const bind = (server: Server) =>
  new Promise<string>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });

before(async () => {
  process.env.RELISTEN_API_BASE_URL = await bind(catalogServer);
  const { default: buildServices } = await import('../src/smapi/services.js');
  soapOrigin = await bind(soapServer);
  const wsdl = readFileSync(new URL('../Sonos.wsdl', import.meta.url), 'utf8');
  for (const format of ['mp3', 'flac'] as const) {
    await new Promise<void>((resolve) =>
      listen(soapServer, `/${format}`, buildServices({ format }), wsdl, resolve)
    );
  }
});

after(() => {
  soapServer.close();
  catalogServer.close();
});

beforeEach(() => {
  requests.length = 0;
  routes.clear();
  routes.set(trackPath, track);
  routes.set(artistPath, artist);
  routes.set(sourcePath, source);
});

const call = async (verb: string, id: string, { format = 'mp3', extra = '' } = {}) => {
  const namespace = 'http://www.sonos.com/Services/1.1';
  const response = await fetch(`${soapOrigin}/${format}`, {
    method: 'POST',
    headers: { 'content-type': 'text/xml; charset=utf-8', 'soapaction': `"${namespace}#${verb}"` },
    body: `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><${verb} xmlns="${namespace}"><id>${id}</id>${extra}</${verb}></s:Body></s:Envelope>`,
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, xml: await response.text() };
};

const assertFault = ({ status, xml }: Awaited<ReturnType<typeof call>>, code: string) => {
  assert.equal(status, 500, xml);
  assert.ok(xml.includes(`<faultcode>${code}</faultcode>`), xml);
};

test('recognizes canonical V4 TypeIDs without changing the numeric wire format', () => {
  assert.deepEqual(parseId(uuidId), { kind: 'uuidTrack', trackId });
  assert.equal(formatId({ kind: 'uuidTrack', trackId }), uuidId);
  const legacy = parseId(legacyId);
  assert.ok(legacy);
  assert.equal(formatId(legacy), legacyId);
  for (const invalid of [
    'TrackU:98615c1f-a84b-de71-5ae0-0e6fff2461f9',
    uuidId.replace('track_', 'show_'),
    uuidId.replace('track_4', 'track_8'),
    uuidId.replace('rc5', 'Rc5'),
    `${uuidId}:123`,
    `${uuidId}/..`,
  ]) {
    assert.equal(parseId(invalid), null, invalid);
  }
});

test('browse emits a numeric track ID and the saved ID still resolves through SOAP', async () => {
  routes.set('/api/v2/artists', [artist]);
  routes.set('/api/v2/artists/grateful-dead/years/1977/1977-05-08', {
    display_date: source.display_date,
    venue: source.imported_venue,
    sources: [
      {
        id: 4152204,
        sets: [
          {
            tracks: [
              {
                id: 5182438,
                title: track.title,
                duration: track.duration,
                mp3_url: 'https://archive.org/download/tape/Minglewood Blues.mp3',
              },
            ],
          },
        ],
      },
    ],
  });

  const browse = await call('getMetadata', albumId, { extra: '<index>0</index><count>10</count>' });
  assert.equal(browse.status, 200);
  assert.ok(browse.xml.includes(`<id>${legacyId}</id>`), browse.xml);
  const metadata = await call('getMediaMetadata', legacyId);
  assert.equal(metadata.status, 200);
  assert.ok(metadata.xml.includes(`<albumId>${albumId}</albumId>`), metadata.xml);
  const uri = await call('getMediaURI', legacyId);
  assert.equal(uri.status, 200);
  assert.ok(uri.xml.includes(`<getMediaURIResult>${proxiedMp3}</getMediaURIResult>`), uri.xml);
});

test('UUID track metadata is serialized in WSDL order by both metadata verbs', async () => {
  for (const verb of ['getMediaMetadata', 'getExtendedMetadata']) {
    const { status, xml } = await call(verb, uuidId, { format: 'flac' });
    assert.equal(status, 200);
    assert.ok(
      xml.includes(
        `<id>${uuidId}</id><itemType>track</itemType><title>Minglewood Blues</title><mimeType>audio/mp3</mimeType>` +
          '<trackMetadata><artistId>Artist:grateful-dead</artistId><artist>Grateful Dead</artist><album>1977-05-08 Barton Hall</album><duration>381</duration><canPlay>true</canPlay>'
      ),
      xml
    );
    if (verb === 'getExtendedMetadata') assert.match(xml, /<mediaMetadata>/);
  }
  assert.ok(requests.every(({ authorization }) => authorization === undefined));
});

test('UUID FLAC endpoint falls back to MP3 and preserves an already-escaped audio URL', async () => {
  const { status, xml } = await call('getMediaURI', uuidId, { format: 'flac' });
  assert.equal(status, 200);
  assert.ok(xml.includes(`<getMediaURIResult>${proxiedMp3}</getMediaURIResult>`), xml);
});

test('UUID playback uses the artist slug for Phish proxying and honors FLAC', async () => {
  routes.set(trackPath, { ...track, flac_url: 'https://phish.in/tape.flac' });
  routes.set(artistPath, { slug: 'phish', name: 'Phish' });
  const { status, xml } = await call('getMediaURI', uuidId, { format: 'flac' });
  assert.equal(status, 200);
  assert.match(
    xml,
    /<getMediaURIResult>https:\/\/audio-bare.relisten.net\/phish.in\/tape.flac<\/getMediaURIResult>/
  );
  const metadata = await call('getMediaMetadata', uuidId, { format: 'flac' });
  assert.match(metadata.xml, /<mimeType>audio\/flac<\/mimeType>/);
});

test('unknown and malformed UUID tracks return ItemNotFound', async () => {
  routes.set(trackPath, 404);
  for (const verb of ['getMediaURI', 'getMediaMetadata', 'getExtendedMetadata']) {
    assertFault(await call(verb, uuidId), 'Client.ItemNotFound');
    assertFault(await call(verb, `${uuidId}:extra`), 'Client.ItemNotFound');
  }
  assert.deepEqual(
    requests.map(({ url }) => url),
    [trackPath, trackPath, trackPath]
  );
});

test('known UUID tracks without audio have unplayable metadata and a stream fault', async () => {
  routes.set(trackPath, { ...track, mp3_url: null, duration: null });
  assertFault(await call('getMediaURI', uuidId, { format: 'flac' }), 'Client.ItemNotFound');
  const metadata = await call('getMediaMetadata', uuidId, { format: 'flac' });
  assert.equal(metadata.status, 200);
  assert.match(metadata.xml, /<title>Minglewood Blues<\/title>/);
  assert.match(metadata.xml, /<canPlay>false<\/canPlay>/);
  assert.doesNotMatch(metadata.xml, /<duration/);
});

test('a catalog outage returns a service fault instead of a missing track', async () => {
  routes.set(trackPath, 503);
  for (const verb of ['getMediaURI', 'getMediaMetadata', 'getExtendedMetadata']) {
    assertFault(await call(verb, uuidId), 'Server.ServiceUnavailable');
  }
});
