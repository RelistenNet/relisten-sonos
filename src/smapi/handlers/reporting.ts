import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getShow, reportPlay } from '../../relisten/api.js';
import { findSource, findTrack } from '../../relisten/tracks.js';
import { smapiHandler } from '../respond.js';

type ReportArgs = { id?: string; seconds?: number; status?: string };

export const reportPlayStatus = smapiHandler<ReportArgs>('reportPlayStatus', async (args) => {
  const { id, seconds, status } = args;

  winston.info('reportPlayStatus', { id, status, seconds, args });

  // do nothing.. for now.
  return { reportPlayStatusResult: '' };
});

export const setPlayedSeconds = smapiHandler<ReportArgs>('setPlayedSeconds', async () => {
  // winston.info('setPlayedSeconds', { id, status, seconds, args });

  // do nothing.. for now.
  return { setPlayedSecondsResult: '' };
});

export const reportPlaySeconds = smapiHandler<ReportArgs>(
  'reportPlaySeconds',
  async (args) => {
    const { id, seconds } = args;

    // winston.info('reportPlaySeconds', { id, seconds, args });

    const parsed = parseId(id);

    if (!parsed || parsed.kind !== 'track') {
      winston.error('unparseable reportPlaySeconds id', { id });
      return { reportPlaySecondsResult: '' };
    }

    const { slug, year, date, sourceId, trackId } = parsed;

    // only report initial play
    if (seconds !== undefined && seconds > 25) {
      return { reportPlaySecondsResult: '' };
    }

    const show = await getShow(slug, year, date);

    if (!show || !show.sources) {
      winston.error('no SONG json tracks found', { slug, year, date, sourceId });
      return { reportPlaySecondsResult: '' };
    }

    const source = findSource(show, sourceId);

    if (!source || !source.sets) {
      winston.error('no SONG source found', { slug, year, date, sourceId });
      return { reportPlaySecondsResult: '' };
    }

    const track = findTrack(source, trackId);

    if (!track) return { reportPlaySecondsResult: '' };

    // submit play POST
    reportPlay(track.id);

    return { reportPlaySecondsResult: '' };
  },
  { errorResult: { reportPlaySecondsResult: '' } }
);
