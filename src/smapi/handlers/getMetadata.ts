import { formatId, parseId } from '../../ids.js';
import { sortTapes } from '../../lib/utils.js';
import winston from '../../logger.js';
import {
  getArtistSongs,
  getArtistVenues,
  getArtistYears,
  getRecentShows,
  getShow,
  getSongShows,
  getVenueShows,
  getYearShows,
} from '../../relisten/api.js';
import type { Show } from '../../relisten/types.js';
import { getArtistName, refreshArtists } from '../../relisten/artists.js';
import { findSource } from '../../relisten/tracks.js';
import {
  artistToItem,
  latestShowToItem,
  latestTapesItem,
  latestTapesYearItem,
  showToItem,
  songToItem,
  songsContainerItem,
  sourceToItem,
  topShowsContainerItem,
  trackToItem,
  venueToItem,
  venuesContainerItem,
  yearToItem,
} from '../presenters.js';
import { paginate, smapiHandler } from '../respond.js';

type MetadataArgs = { id?: string; index?: number; count?: number };

const getRoot = async (args: MetadataArgs) => {
  const artists = await refreshArtists();

  const allResults = [latestTapesItem(), ...artists.map(artistToItem)];
  const getMetadataResult = paginate(allResults, args);

  winston.info(
    `getRoot allResults.length=${allResults.length}, results.length=${getMetadataResult.count}`
  );

  return { getMetadataResult };
};

const getLatest = async (args: MetadataArgs) => {
  const shows = await getRecentShows();

  return { getMetadataResult: paginate(shows.map(latestShowToItem), args) };
};

const getYears = async (args: MetadataArgs, slug: string) => {
  const years = await getArtistYears(slug);

  const allResults = [
    latestTapesYearItem(slug),
    topShowsContainerItem(slug),
    venuesContainerItem(slug),
    songsContainerItem(slug),
    ...years.map((year) => yearToItem(slug, year)),
  ];

  return { getMetadataResult: paginate(allResults, args) };
};

const getShows = async (args: MetadataArgs, slug: string, year: string) => {
  const shows = await getYearShows(slug, year);

  if (!shows) {
    winston.error('error', { id: args.id });
    return {};
  }

  const allResults = shows.map((show) => showToItem(slug, year, show));

  return { getMetadataResult: paginate(allResults, args) };
};

const getSources = async (
  args: MetadataArgs,
  format: string,
  slug: string,
  year: string,
  date: string
) => {
  const show = await getShow(slug, year, date);

  if (!show || !show.sources) {
    winston.error('error', { id: args.id });
    return {};
  }

  // Bound to a local so the narrowing above survives into the callbacks below.
  const { sources } = show;

  // if (show.sources.length === 1) return getTracks(format, formatId({ kind: 'source', slug, year, date, sourceId: `${show.sources[0].id}` }), callback);

  // These artists only ever have the one source per show, so skip the picker.
  if (slug === 'wsp' || slug === 'phish' || slug === 'trey') {
    return getTracks(
      {
        id: formatId({ kind: 'source', slug, year, date, sourceId: `${sources[0].id}` }),
        count: 500,
        index: 0,
      },
      format
    );
  }

  const allResults = sortTapes(sources)
    .filter((source) => (format === 'flac' ? source.flac_type !== 'Flac24Bit' : true))
    .map((source) =>
      sourceToItem({
        slug,
        year,
        date,
        show,
        source,
        format,
        artSourceId: sources[0].id,
      })
    );

  return { getMetadataResult: paginate(allResults, args) };
};

const getTracks = async (args: MetadataArgs, format: string) => {
  // The id of the album we are listing tracks for; every track points back at it.
  const albumId = args.id;
  const parsed = parseId(albumId);

  // `!albumId` is implied by `!parsed`, but stating it keeps albumId a string.
  if (!albumId || !parsed || parsed.kind !== 'source') return {};

  const { slug, year, date, sourceId } = parsed;

  const artistName = await getArtistName(slug);
  const show = await getShow(slug, year, date);

  if (!show || !show.sources) {
    winston.error('no json tracks found', { slug, year, date, sourceId });
    return {};
  }

  const source = findSource(show, sourceId);

  if (!source || !source.sets) {
    winston.error('no source found', { slug, year, date, sourceId });
    return {};
  }

  // Track ids (and album art) carry the year off the show date, which differs
  // from the year in the album id whenever that one is `latest`.
  const [dateYear] = date.split('-');

  let trackIdx = 0;

  const tracks = source.sets.flatMap((set) =>
    set.tracks.map((track) =>
      trackToItem({
        albumId,
        slug,
        year: dateYear,
        date,
        sourceId,
        artistName,
        show,
        track,
        trackNumber: ++trackIdx,
        format,
      })
    )
  );

  return { getMetadataResult: paginate(tracks, args, 'mediaMetadata') };
};

const getVenues = async (args: MetadataArgs, slug: string) => {
  const venues = await getArtistVenues(slug);

  const sorted = [...venues].sort((a, b) => (b.shows_at_venue ?? 0) - (a.shows_at_venue ?? 0));

  return { getMetadataResult: paginate(sorted.map((v) => venueToItem(slug, v)), args) };
};

const getVenueShowList = async (args: MetadataArgs, slug: string, venueSlug: string) => {
  const venue = await getVenueShows(slug, venueSlug);

  if (!venue?.shows) return {};

  const shows = venue.shows.map((show) => {
    const year = show.year?.year ?? show.display_date.split('-')[0];
    return showToItem(slug, year, show);
  });

  return { getMetadataResult: paginate(shows, args) };
};

const getSongs = async (args: MetadataArgs, slug: string) => {
  const songs = await getArtistSongs(slug);

  const sorted = [...songs].sort((a, b) => b.shows_played_at - a.shows_played_at);

  return { getMetadataResult: paginate(sorted.map((s) => songToItem(slug, s)), args) };
};

const getSongShowList = async (args: MetadataArgs, slug: string, songSlug: string) => {
  const song = await getSongShows(slug, songSlug);

  if (!song?.shows) return {};

  const shows = song.shows.map((show) => {
    const year = show.year?.year ?? show.display_date.split('-')[0];
    return showToItem(slug, year, show);
  });

  return { getMetadataResult: paginate(shows, args) };
};

const topShowsCache = new Map<string, { shows: Show[]; ts: number }>();
const TOP_SHOWS_TTL = 10 * 60 * 1000;

const getTopShows = async (args: MetadataArgs, slug: string) => {
  const cached = topShowsCache.get(slug);
  let allShows: Show[];

  if (cached && Date.now() - cached.ts < TOP_SHOWS_TTL) {
    allShows = cached.shows;
  } else {
    const years = await getArtistYears(slug);
    allShows = (
      await Promise.all(years.map((year) => getYearShows(slug, year.year)))
    ).flatMap((shows) => shows ?? []);
    topShowsCache.set(slug, { shows: allShows, ts: Date.now() });
  }

  const sorted = [...allShows].sort(
    (a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
  );

  const top = sorted.slice(0, 100);

  const items = top.map((show) => {
    const year = show.year?.year ?? show.display_date.split('-')[0];
    return showToItem(slug, year, show);
  });

  return { getMetadataResult: paginate(items, args) };
};

export default (ctx: { format: string }) =>
  smapiHandler<MetadataArgs>(
    'getMetadata',
    async (args) => {
      const { id } = args;
      winston.info('getMetadata', { id, args });

      const parsed = parseId(id);

      if (!parsed) return {};

      switch (parsed.kind) {
        case 'root':
          winston.I.increment('sonos.wsdl.getMetadata.root');
          return getRoot(args);
        case 'latest':
          winston.I.increment('sonos.wsdl.getMetadata.Latest');
          return getLatest(args);
        case 'artist':
          winston.I.increment('sonos.wsdl.getMetadata.Artist');
          return getYears(args, parsed.slug);
        case 'year':
          winston.I.increment('sonos.wsdl.getMetadata.Year');
          return getShows(args, parsed.slug, parsed.year);
        case 'show':
          winston.I.increment('sonos.wsdl.getMetadata.Shows');
          return getSources(args, ctx.format, parsed.slug, parsed.year, parsed.date);
        case 'source':
          winston.I.increment('sonos.wsdl.getMetadata.Show');
          return getTracks(args, ctx.format);
        case 'venues':
          winston.I.increment('sonos.wsdl.getMetadata.Venues');
          return getVenues(args, parsed.slug);
        case 'venue':
          winston.I.increment('sonos.wsdl.getMetadata.Venue');
          return getVenueShowList(args, parsed.slug, parsed.venueSlug);
        case 'songs':
          winston.I.increment('sonos.wsdl.getMetadata.Songs');
          return getSongs(args, parsed.slug);
        case 'song':
          winston.I.increment('sonos.wsdl.getMetadata.Song');
          return getSongShowList(args, parsed.slug, parsed.songSlug);
        case 'topShows':
          winston.I.increment('sonos.wsdl.getMetadata.TopShows');
          return getTopShows(args, parsed.slug);
        default:
          return {};
      }
    },
    // getMetadata reports a metric per id kind rather than one for the verb.
    { metric: null }
  );
