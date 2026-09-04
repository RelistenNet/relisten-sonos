import type { Artist, SearchResults, Show, Song, SongWithShows, Venue, VenueWithShows, Year } from './types.js';

const apiBaseUrl = (
  process.env.RELISTEN_API_BASE_URL ||
  process.env.RELISTEN_API_URL ||
  'https://api.relisten.net'
).replace(/\/$/, '');

const API_V2_ROOT = `${apiBaseUrl}/api/v2`;
const API_V3_ROOT = `${apiBaseUrl}/api/v3`;

const getJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`relisten api request failed with status ${res.status}: ${url}`);
  }

  return res.json() as Promise<T>;
};

export const getArtists = () => getJson<Artist[]>(`${API_V2_ROOT}/artists`);

export const getRecentShows = () => getJson<Show[]>(`${API_V2_ROOT}/shows/recently-added`);

export const getArtistYears = (slug: string) =>
  getJson<Year[]>(`${API_V2_ROOT}/artists/${slug}/years`);

// The `latest` pseudo-year is served by a different endpoint, and the two
// endpoints disagree on their envelope: one returns shows, the other an object
// containing them.
export const getYearShows = async (slug: string, year: string): Promise<Show[] | undefined> => {
  const url =
    year === 'latest'
      ? `${API_V2_ROOT}/artists/${slug}/shows/recently-added`
      : `${API_V2_ROOT}/artists/${slug}/years/${year}`;

  const json = await getJson<Show[] | { shows: Show[] }>(url);

  if (!json) return undefined;

  return Array.isArray(json) ? json : json.shows;
};

export const getShow = (slug: string, year: string, date: string) =>
  getJson<Show>(`${API_V2_ROOT}/artists/${slug}/years/${year}/${date}`);

export const getShowByUuid = (uuid: string) => getJson<Show>(`${API_V3_ROOT}/shows/${uuid}`);

export const reportPlay = (trackId: number | string) =>
  fetch(`${API_V2_ROOT}/live/play?track_id=${trackId}&app_type=sonos`, {
    method: 'POST',
  }).then(() => null);

export const search = async (term: string | undefined): Promise<SearchResults> =>
  getJson<SearchResults>(`${API_V2_ROOT}/search?q=${encodeURIComponent(term ?? '')}`);

export const searchArtists = async (term: string | undefined): Promise<Artist[]> => {
  const json = await search(term);
  return json.Artists;
};

export const getArtistVenues = (slug: string) =>
  getJson<Venue[]>(`${API_V2_ROOT}/artists/${slug}/venues`);

export const getVenueShows = (slug: string, venueSlug: string) =>
  getJson<VenueWithShows>(`${API_V3_ROOT}/artists/${slug}/venues/${venueSlug}`);

export const getArtistSongs = (slug: string) =>
  getJson<Song[]>(`${API_V2_ROOT}/artists/${slug}/songs`);

export const getSongShows = (slug: string, songSlug: string) =>
  getJson<SongWithShows>(`${API_V3_ROOT}/artists/${slug}/songs/${songSlug}`);
