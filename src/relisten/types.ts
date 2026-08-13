// Only the fields we actually read off the Relisten API are modelled here.

export interface Artist {
  slug: string;
  name: string;
}

export interface Venue {
  name: string;
  location: string;
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
  sets?: SetList[];
  venue?: Venue;
}

export interface Year {
  year: string;
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
}

export interface SearchResults {
  artists: Artist[];
}
