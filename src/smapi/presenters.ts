import { formatId } from '../ids.js';
import { durationToHHMMSS } from '../lib/utils.js';
import type { Artist, Show, Song, Source, Track, Venue, Year } from '../relisten/types.js';

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

const soundboardPrefix = (isSoundboard: boolean | undefined) => (isSoundboard ? '[SBD]' : '[AUD]');

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
  displayType: 'hero',
  title: LATEST_TAPES,
  summary: 'Latest recordings',
  canPlay: false,
  canEnumerate: true,
});

// The per-artist equivalent, which browses to a pseudo-year named `latest`.
export const latestTapesYearItem = (slug: string) => ({
  id: formatId({ kind: 'year', slug, year: 'latest' }),
  itemType: 'container',
  displayType: 'hero',
  title: LATEST_TAPES,
  summary: 'Most recent recordings',
  canPlay: false,
  canEnumerate: true,
});

export const latestShowToItem = (show: Show) => {
  const { artist, year } = show;

  // The recently-added feed always embeds both, and there is no id to hand back
  // without them. Previously this threw a TypeError a few lines further down.
  if (!artist || !year) {
    throw new Error(`recently-added show ${show.display_date} is missing its artist or year`);
  }

  const artistName = artist.name;

  const parts = [
    artistName && `${soundboardPrefix(show.has_soundboard_source)} ${artistName}`,
    show.display_date,
    show.venue && show.venue.name,
    show.venue && show.venue.location,
  ];

  return {
    id: formatId({
      kind: 'show',
      slug: artist.slug,
      year: year.year,
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
  title: year.show_count ? `${year.year} (${year.show_count} shows)` : year.year,
  summary: year.year,
  canPlay: false,
  canEnumerate: true,
});

const ratingStars = (rating: number | undefined) => {
  if (!rating || rating <= 0) return '';
  const rounded = Math.round(rating * 10) / 10;
  return ` ${rounded.toFixed(1)}★`;
};

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
  summary: [
    show.display_date,
    show.venue?.name,
    show.avg_rating ? `${show.avg_rating.toFixed(1)}★` : '',
  ]
    .filter((x) => x)
    .join(' • '),
  canPlay: true,
  canEnumerate: true,
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
  // Omitted from the album art url when the source has no id.
  artSourceId: string | number | undefined;
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
      ratingStars(source.avg_rating_weighted),
      format === 'flac' &&
        source.flac_type === 'Flac16Bit' &&
        show.has_streamable_flac_source &&
        '[FLAC]',
    ]
      .filter((x) => x)
      .join(' '),
    summary: [
      source.description || sourceTitle,
      source.avg_rating_weighted
        ? `${source.avg_rating_weighted.toFixed(1)}★ (${source.num_ratings ?? 0} ratings)`
        : '',
    ]
      .filter((x) => x)
      .join(' • '),
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

export const venuesContainerItem = (slug: string) => ({
  id: formatId({ kind: 'venues', slug }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: 'Venues',
  summary: 'Browse by venue',
  canPlay: false,
  canEnumerate: true,
});

export const songsContainerItem = (slug: string) => ({
  id: formatId({ kind: 'songs', slug }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: 'Songs',
  summary: 'Browse by song',
  canPlay: false,
  canEnumerate: true,
});

export const topShowsContainerItem = (slug: string) => ({
  id: formatId({ kind: 'topShows', slug }),
  itemType: 'container',
  displayType: 'list',
  title: 'Top Shows',
  summary: 'Most popular shows',
  canPlay: false,
  canEnumerate: true,
});

export const venueToItem = (slug: string, venue: Venue) => ({
  id: formatId({ kind: 'venue', slug, venueSlug: venue.slug ?? '' }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: `${venue.name} (${venue.shows_at_venue ?? 0})`,
  summary: venue.location,
  canPlay: false,
  canEnumerate: true,
});

export const songToItem = (slug: string, song: Song) => ({
  id: formatId({ kind: 'song', slug, songSlug: song.slug }),
  itemType: 'container',
  displayType: 'list-sans-thumbs',
  title: `${song.name} (${song.shows_played_at})`,
  summary: `Played ${song.shows_played_at} time${song.shows_played_at === 1 ? '' : 's'}`,
  canPlay: false,
  canEnumerate: true,
});

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
