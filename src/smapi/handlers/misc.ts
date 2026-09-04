import { formatId, parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getShow } from '../../relisten/api.js';
import { findSource } from '../../relisten/tracks.js';
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

export const getExtendedMetadata = (args: { id?: string }) => {
  winston.I.increment('sonos.wsdl.getExtendedMetadata');

  const parsed = parseId(args.id);
  if (!parsed) {
    return {
      getExtendedMetadataResult: {
        mediaCollection: { id: args.id, itemType: 'container', title: '' },
      },
    };
  }

  switch (parsed.kind) {
    case 'artist': {
      return {
        getExtendedMetadataResult: {
          mediaCollection: {
            id: args.id,
            itemType: 'artist',
            title: '',
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
      return {
        getExtendedMetadataResult: {
          mediaCollection: {
            id: args.id,
            itemType: 'album',
            title: '',
            canEnumerate: true,
            canPlay: true,
          },
          relatedBrowse: [
            { id: formatId({ kind: 'show', slug, year, date }), type: 'ALL_SOURCES' },
          ],
        },
      };
    }

    default:
      return {
        getExtendedMetadataResult: {
          mediaCollection: { id: args.id, itemType: 'container', title: '' },
        },
      };
  }
};

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
              getExtendedMetadataTextResult: {
                getExtendedMetadataTextResult: parts.join('\n\n'),
              },
            };
          }
        }
      }
    }

    return {
      getExtendedMetadataTextResult: {
        getExtendedMetadataTextResult: '',
      },
    };
  }
);
