// Only the fields we actually read off the Relisten API are modelled here.

export interface Artist {
  slug: string;
  name: string;
}

export interface Venue {
  name: string;
  location: string;
  slug?: string;
  shows_at_venue?: number;
}

export interface Track {
  id: number | string;
  title: string;
  duration: number;
  mp3_url?: string;
  flac_url?: string;
}

export interface SetList {
  tracks: Track[];
}

export interface Source {
  id?: number | string;
  uuid?: string;
  is_soundboard?: boolean;
  flac_type?: string;
  taper?: string;
  transferrer?: string;
  source?: string;
  lineage?: string;
  description?: string;
  upstream_identifier?: string;
  avg_rating_weighted?: number;
  avg_rating?: number;
  num_ratings?: number;
  sets?: SetList[];
  venue?: Venue;
  slim_artist?: SlimArtist;
  display_date?: string;
}

export interface Year {
  year: string;
  show_count?: number;
}

export interface Show {
  display_date: string;
  source_count?: number;
  has_soundboard_source?: boolean;
  has_streamable_flac_source?: boolean;
  artist?: Artist;
  year?: Year;
  venue?: Venue;
  sources?: Source[];
  avg_rating?: number;
}

export interface SlimArtist {
  slug: string;
  name: string;
}

export interface Song {
  name: string;
  slug: string;
  shows_played_at: number;
  slim_artist?: SlimArtist;
}

export interface VenueWithShows extends Venue {
  shows?: Show[];
}

export interface SongWithShows extends Song {
  shows?: Show[];
}

export interface SearchResults {
  Artists: Artist[];
  Shows: Show[];
  Songs: Song[];
  Sources: Source[];
  Venues: Venue[];
}
