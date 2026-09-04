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
    return { getExtendedMetadataResult: { mediaMetadata: { id: args.id, itemType: 'other' } } };
  }

  switch (parsed.kind) {
    case 'artist': {
      return {
        getExtendedMetadataResult: {
          mediaMetadata: { id: args.id, itemType: 'artist' },
          relatedBrowse: [
            {
              id: formatId({ kind: 'topShows', slug: parsed.slug }),
              type: 'RELATED_ARTISTS',
              title: 'Top Shows',
            },
            {
              id: formatId({ kind: 'venues', slug: parsed.slug }),
              type: 'RELATED_ARTISTS',
              title: 'Venues',
            },
            {
              id: formatId({ kind: 'songs', slug: parsed.slug }),
              type: 'RELATED_ARTISTS',
              title: 'Songs',
            },
          ],
        },
      };
    }

    case 'source': {
      const { slug, year, date } = parsed;
      return {
        getExtendedMetadataResult: {
          mediaMetadata: { id: args.id, itemType: 'album' },
          relatedBrowse: [
            {
              id: formatId({ kind: 'show', slug, year, date }),
              type: 'RELATED_ARTISTS',
              title: 'All Sources',
            },
          ],
        },
      };
    }

    default:
      return {
        getExtendedMetadataResult: {
          mediaMetadata: { id: args.id, itemType: 'other' },
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
