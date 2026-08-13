import { formatId } from '../ids.js';
import { durationToHHMMSS } from '../lib/utils.js';
import type { Artist, Show, Source, Track, Year } from '../relisten/types.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALBUM_ART_CDN = IS_PRODUCTION ? 'https://relisten.net' : 'http://192.168.0.19:3000';

const LATEST_TAPES = 'Latest Tapes';

export const artistWrapper = (name: string) => {
  if (name === 'Phish') return 'Phish (by Phish.in)';

  return name;
};

export const albumArtURI = (slug: string, year: string, date: string, sourceId?: string | number) =>
  `${ALBUM_ART_CDN}/album-art/${slug}/years/${year}/${date}${
    sourceId === undefined ? '' : `/${sourceId}`
  }/600.png`;

const soundboardPrefix = (isSoundboard: boolean) => (isSoundboard ? '[SBD]' : '[AUD]');

export const artistToItem = (artist: Artist) => ({
  id: formatId({ kind: 'artist', slug: artist.slug }),
  itemType: 'artist',
  displayType: 'list-sans-thumbs',
  title: artistWrapper(artist.name),
  summary: artist.name,
  canPlay: false,
  // albumArtURI: ''
});

export const searchArtistToItem = (artist: Artist) => ({
  id: formatId({ kind: 'artist', slug: artist.slug }),
  itemType: 'artist',
  // displayType: 'list',
  title: artist.name,
  summary: artist.name,
  canEnumerate: true,
  authrequired: 0,
  canPlay: false,
  // albumArtURI: ''
});

// The `latest` container at the top of the root listing.
export const latestTapesItem = () => ({
  id: formatId({ kind: 'latest' }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: LATEST_TAPES,
  summary: 'Latest recordings',
  canPlay: false,
  // albumArtURI: ''
});

// The per-artist equivalent, which browses to a pseudo-year named `latest`.
export const latestTapesYearItem = (slug: string) => ({
  id: formatId({ kind: 'year', slug, year: 'latest' }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: LATEST_TAPES,
  summary: 'Most recent recordings',
  canPlay: false,
  // albumArtURI: ''
});

export const latestShowToItem = (show: Show) => {
  const artistName = show.artist && show.artist.name;

  const parts = [
    artistName && `${soundboardPrefix(show.has_soundboard_source)} ${artistName}`,
    show.display_date,
    show.venue && show.venue.name,
    show.venue && show.venue.location,
  ];

  return {
    id: formatId({
      kind: 'show',
      slug: show.artist.slug,
      year: show.year.year,
      date: show.display_date,
    }),
    itemType: 'container',
    displayType: 'list-sans-thumbs',
    title: parts.filter((x) => x).join(' - '),
    summary: parts.filter((x) => x).join(' '),
    canPlay: false,
    // albumArtURI: ''
  };
};

export const yearToItem = (slug: string, year: Year) => ({
  id: formatId({ kind: 'year', slug, year: year.year }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: year.year,
  summary: year.year,
  canPlay: false,
  // albumArtURI: ''
});

export const showToItem = (slug: string, year: string, show: Show) => ({
  id: formatId({ kind: 'show', slug, year, date: show.display_date }),
  itemType: 'container',
  displayType: 'list',
  title:
    [
      `${soundboardPrefix(show.has_soundboard_source)} ${show.display_date}`,
      show.venue && show.venue.name,
      show.venue && show.venue.location,
    ]
      .filter((x) => x)
      .join(' - ') + ` [${show.source_count}]`,
  summary: show.display_date,
  canPlay: show.source_count === 1,
  albumArtURI: albumArtURI(slug, year, show.display_date),
});

export const sourceToItem = ({
  slug,
  year,
  date,
  show,
  source,
  format,
  artSourceId,
}: {
  slug: string;
  year: string;
  date: string;
  show: Show;
  source: Source;
  format: string;
  artSourceId: string | number;
}) => {
  const person = source.taper || source.transferrer;
  const sourceTitle = source.source || source.lineage;

  return {
    id: formatId({ kind: 'source', slug, year, date, sourceId: `${source.id}` }),
    itemType: 'album',
    displayType: 'list',
    title: [
      `${soundboardPrefix(source.is_soundboard)} ${sourceTitle}`,
      person ? `by ${person}` : null,
      format === 'flac' &&
        source.flac_type === 'Flac16Bit' &&
        show.has_streamable_flac_source &&
        '[FLAC]',
    ]
      .filter((x) => x)
      .join(' '),
    summary: source.description || '',
    canPlay: true,
    albumArtURI: albumArtURI(slug, year, date, artSourceId),
  };
};

export const trackToItem = ({
  albumId,
  slug,
  year,
  date,
  sourceId,
  artistName,
  show,
  track,
  trackNumber,
  format,
}: {
  albumId: string;
  slug: string;
  // NOTE: this is the year taken from the show date, which is not always the
  // year in the album id (that one may be the literal `latest`).
  year: string;
  date: string;
  sourceId: string;
  artistName: string;
  show: Show;
  track: Track;
  trackNumber: number;
  format: string;
}) => {
  const [, month, day] = date.split('-');

  return {
    id: formatId({ kind: 'track', slug, year, date, sourceId, trackId: `${track.id}` }),
    itemType: 'track',
    mimeType: trackMimeType(track, format),
    title: `${track.title} [${durationToHHMMSS(track.duration)}]`,
    canPlay: true,
    trackMetadata: {
      albumId,
      duration: track.duration,
      artistId: formatId({ kind: 'artist', slug }),
      artist: artistName,
      albumArtURI: albumArtURI(slug, year, date, sourceId),
      trackNumber,
      album: [
        `${Number(month)}/${Number(day)}/${year.slice(2)}`,
        show.venue ? show.venue.name : '',
        show.venue ? show.venue.location : '',
      ]
        .filter((x) => x)
        .join(' - '),
    },
  };
};

export const trackMimeType = (track: Track, format: string) =>
  format === 'flac' && track.flac_url ? 'audio/flac' : 'audio/mp3';

export const trackMetadata = ({
  id,
  slug,
  year,
  date,
  sourceId,
  artistName,
  show,
  track,
  format,
}: {
  id: string;
  slug: string;
  year: string;
  date: string;
  sourceId: string;
  artistName: string;
  show: Show;
  track: Track;
  format: string;
}) => ({
  id,
  itemType: 'track',
  title: track.title,
  genre: '',
  mimeType: trackMimeType(track, format),
  trackMetadata: {
    albumId: formatId({ kind: 'source', slug, year, date, sourceId }),
    duration: track.duration,
    artistId: formatId({ kind: 'artist', slug }),
    artist: artistName,
    album: [`${show.display_date}`, show.venue ? show.venue.name : ''].filter((x) => x).join(' '),
    // albumArtURI: '',
    canPlay: true,
    canSkip: true,
    canAddToFavorites: false,
  },
});
