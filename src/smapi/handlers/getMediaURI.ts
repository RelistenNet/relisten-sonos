import { isUuidTrackRequest, parseId } from '../../ids.js';
import winston from '../../logger.js';
import { audioUrlForTrack, findLegacyTrack, proxyStreamUrl } from '../../relisten/tracks.js';
import { smapiHandler } from '../respond.js';
import { uuidTrackStream } from '../uuidTrack.js';

type MediaURIArgs = { id?: string };

const legacyTrackStream = async (id: string | undefined, format: string) => {
  const parsed = parseId(id);
  if (parsed?.kind !== 'track') return undefined;
  const found = await findLegacyTrack(parsed);
  const url = found && audioUrlForTrack(found.track, format);
  return url && encodeURI(proxyStreamUrl(url, parsed.slug));
};

export default (ctx: { format: string }) =>
  smapiHandler<MediaURIArgs>(
    'getMediaURI',
    async ({ id }) => {
      winston.info('getMediaURI', { type: ctx.format, id });

      const trackUrl = isUuidTrackRequest(id)
        ? await uuidTrackStream(id, ctx.format)
        : await legacyTrackStream(id, ctx.format);
      if (!trackUrl) {
        winston.info('no stream url for getMediaURI', { id });
        return { getMediaURIResult: '' };
      }

      const result = {
        getMediaURIResult: trackUrl,
        httpHeaders: [],
      };

      winston.info('stream URI resolved', { id, format: ctx.format });

      return result;
    },
    { errorResult: { getMediaURIResult: '' } }
  );
