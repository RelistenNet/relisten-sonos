import { formatId, parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getShow } from '../../relisten/api.js';
import { getArtistName } from '../../relisten/artists.js';
import { findSource } from '../../relisten/tracks.js';
import { artistWrapper } from '../presenters.js';
import { smapiHandler } from '../respond.js';

export const getLastUpdate = () => {
  winston.I.increment('sonos.wsdl.getLastUpdate');

  return {
    getLastUpdateResult: {
      favorites: 0,
      catalog: 0,
      pollInterval: 60,
    },
  };
};

const containerResult = (id: string | undefined) => ({
  getExtendedMetadataResult: {
    mediaCollection: { id, itemType: 'container', title: '' },
  },
});

export const getExtendedMetadata = smapiHandler<{ id?: string }>(
  'getExtendedMetadata',
  async (args) => {
    const parsed = parseId(args.id);
    if (!parsed) return containerResult(args.id);

    switch (parsed.kind) {
      case 'artist': {
        return {
          getExtendedMetadataResult: {
            mediaCollection: {
              id: args.id,
              itemType: 'artist',
              title: artistWrapper(await getArtistName(parsed.slug)),
              canEnumerate: true,
            },
            relatedBrowse: [
              { id: formatId({ kind: 'topShows', slug: parsed.slug }), type: 'TOP_SHOWS' },
              { id: formatId({ kind: 'venues', slug: parsed.slug }), type: 'VENUES' },
              { id: formatId({ kind: 'songs', slug: parsed.slug }), type: 'SONGS' },
            ],
          },
        };
      }

      case 'source': {
        const { slug, year, date } = parsed;
        const artistName = await getArtistName(slug);
        return {
          getExtendedMetadataResult: {
            mediaCollection: {
              id: args.id,
              itemType: 'album',
              title: [artistWrapper(artistName), date].filter((x) => x).join(' - '),
              canEnumerate: true,
              canPlay: true,
            },
            relatedBrowse: [
              { id: formatId({ kind: 'show', slug, year, date }), type: 'ALL_SOURCES' },
            ],
            relatedText: [{ id: args.id, type: 'ALBUM_NOTES' }],
          },
        };
      }

      default:
        return containerResult(args.id);
    }
  },
  { errorResult: containerResult(undefined) }
);

type ExtendedTextArgs = { id?: string; type?: string };

export const getExtendedMetadataText = smapiHandler<ExtendedTextArgs>(
  'getExtendedMetadataText',
  async (args) => {
    const parsed = parseId(args.id);

    if (parsed?.kind === 'source') {
      const { slug, year, date, sourceId } = parsed;
      const show = await getShow(slug, year, date);

      if (show?.sources) {
        const source = findSource(show, sourceId);
        if (source) {
          const parts: string[] = [];
          if (source.description) parts.push(source.description);
          if (source.taper) parts.push(`Taper: ${source.taper}`);
          if (source.transferrer) parts.push(`Transferrer: ${source.transferrer}`);
          if (source.lineage) parts.push(`Lineage: ${source.lineage}`);
          if (source.source) parts.push(`Source: ${source.source}`);

          if (parts.length) {
            return {
              getExtendedMetadataTextResult: parts.join('\n\n'),
            };
          }
        }
      }
    }

    return {
      getExtendedMetadataTextResult: '',
    };
  }
);
