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
    };

// Ids arrive straight off the SOAP wire, so they may well be missing entirely.
export const parseId = (raw: string | undefined): SonosId | null => {
  if (!raw) return null;

  if (raw === 'root') return { kind: 'root' };
  if (raw === 'latest') return { kind: 'latest' };

  const [prefix, ...rest] = raw.split(':');

  switch (prefix) {
    case 'Artist': {
      const [slug] = rest;
      if (rest.length !== 1) return null;
      return { kind: 'artist', slug };
    }
    case 'Year': {
      const [slug, year] = rest;
      if (rest.length !== 2) return null;
      return { kind: 'year', slug, year };
    }
    case 'Shows': {
      const [slug, year, date] = rest;
      if (rest.length !== 3) return null;
      return { kind: 'show', slug, year, date };
    }
    case 'Show': {
      const [slug, year, date, sourceId] = rest;
      if (rest.length !== 4) return null;
      return { kind: 'source', slug, year, date, sourceId };
    }
    case 'Track': {
      const [slug, year, date, sourceId, trackId] = rest;
      if (rest.length !== 5) return null;
      return { kind: 'track', slug, year, date, sourceId, trackId };
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
  }
};
