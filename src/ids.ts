// The wire format for every id we hand to (and take back from) Sonos.
//
// These strings live forever in users' favorites and queues, so the formatting
// below must never change. Note the two very similar prefixes:
//
//   Shows: — a show container (one date, possibly many sources)
//   Show:  — a single source/album of that show
export type SonosId =
  | { kind: 'root' }
  | { kind: 'latest' }
  | { kind: 'artist'; slug: string }
  // year may be the literal string 'latest'
  | { kind: 'year'; slug: string; year: string }
  | { kind: 'show'; slug: string; year: string; date: string }
  | { kind: 'source'; slug: string; year: string; date: string; sourceId: string }
  | {
      kind: 'track';
      slug: string;
      year: string;
      date: string;
      sourceId: string;
      trackId: string;
    }
  | { kind: 'venues'; slug: string }
  | { kind: 'venue'; slug: string; venueSlug: string }
  | { kind: 'songs'; slug: string }
  | { kind: 'song'; slug: string; songSlug: string }
  | { kind: 'topShows'; slug: string };

// Slugs arrive from the SOAP wire and end up in upstream API URLs.
// Reject anything that could cause path traversal or URL manipulation.
const SAFE_SLUG = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i;
const SAFE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_YEAR = /^(\d{4}|latest)$/;
const SAFE_ID = /^\d+$/;

const validSlug = (s: string) => SAFE_SLUG.test(s);
const validDate = (s: string) => SAFE_DATE.test(s);
const validYear = (s: string) => SAFE_YEAR.test(s);
const validId = (s: string) => SAFE_ID.test(s);

// Ids arrive straight off the SOAP wire, so they may well be missing entirely.
export const parseId = (raw: string | undefined): SonosId | null => {
  if (!raw) return null;

  if (raw === 'root') return { kind: 'root' };
  if (raw === 'latest') return { kind: 'latest' };

  const [prefix, ...rest] = raw.split(':');

  switch (prefix) {
    case 'Artist': {
      const [slug] = rest;
      if (rest.length !== 1 || !validSlug(slug)) return null;
      return { kind: 'artist', slug };
    }
    case 'Year': {
      const [slug, year] = rest;
      if (rest.length !== 2 || !validSlug(slug) || !validYear(year)) return null;
      return { kind: 'year', slug, year };
    }
    case 'Shows': {
      const [slug, year, date] = rest;
      if (rest.length !== 3 || !validSlug(slug) || !validYear(year) || !validDate(date))
        return null;
      return { kind: 'show', slug, year, date };
    }
    case 'Show': {
      const [slug, year, date, sourceId] = rest;
      if (
        rest.length !== 4 ||
        !validSlug(slug) ||
        !validYear(year) ||
        !validDate(date) ||
        !validId(sourceId)
      )
        return null;
      return { kind: 'source', slug, year, date, sourceId };
    }
    case 'Track': {
      const [slug, year, date, sourceId, trackId] = rest;
      if (
        rest.length !== 5 ||
        !validSlug(slug) ||
        !validYear(year) ||
        !validDate(date) ||
        !validId(sourceId) ||
        !validId(trackId)
      )
        return null;
      return { kind: 'track', slug, year, date, sourceId, trackId };
    }
    case 'Venues': {
      const [slug] = rest;
      if (rest.length !== 1 || !validSlug(slug)) return null;
      return { kind: 'venues', slug };
    }
    case 'Venue': {
      const [slug, venueSlug] = rest;
      if (rest.length !== 2 || !validSlug(slug) || !validSlug(venueSlug)) return null;
      return { kind: 'venue', slug, venueSlug };
    }
    case 'ArtistSongs': {
      const [slug] = rest;
      if (rest.length !== 1 || !validSlug(slug)) return null;
      return { kind: 'songs', slug };
    }
    case 'ArtistSong': {
      const [slug, songSlug] = rest;
      if (rest.length !== 2 || !validSlug(slug) || !validSlug(songSlug)) return null;
      return { kind: 'song', slug, songSlug };
    }
    case 'TopShows': {
      const [slug] = rest;
      if (rest.length !== 1 || !validSlug(slug)) return null;
      return { kind: 'topShows', slug };
    }
    default:
      return null;
  }
};

export const formatId = (id: SonosId): string => {
  switch (id.kind) {
    case 'root':
      return 'root';
    case 'latest':
      return 'latest';
    case 'artist':
      return `Artist:${id.slug}`;
    case 'year':
      return `Year:${id.slug}:${id.year}`;
    case 'show':
      return `Shows:${id.slug}:${id.year}:${id.date}`;
    case 'source':
      return `Show:${id.slug}:${id.year}:${id.date}:${id.sourceId}`;
    case 'track':
      return `Track:${id.slug}:${id.year}:${id.date}:${id.sourceId}:${id.trackId}`;
    case 'venues':
      return `Venues:${id.slug}`;
    case 'venue':
      return `Venue:${id.slug}:${id.venueSlug}`;
    case 'songs':
      return `ArtistSongs:${id.slug}`;
    case 'song':
      return `ArtistSong:${id.slug}:${id.songSlug}`;
    case 'topShows':
      return `TopShows:${id.slug}`;
  }
};
