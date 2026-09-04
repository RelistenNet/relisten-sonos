import winston from '../logger.js';
import type { SmapiArgs, SmapiCallback } from './types.js';

type HandlerOptions = {
  // What to hand back when the handler throws. Every verb has its own shape.
  errorResult?: unknown;
  // Instrumental metric to bump, or null when the handler bumps its own
  // (getMetadata reports per-id-kind).
  metric?: string | null;
};

// Wraps an async handler into the (args, callback) signature node-soap expects.
// The wrapper must not itself be async: node-soap treats any returned value —
// including a promise — as the SOAP result.
export const smapiHandler =
  <TArgs extends SmapiArgs>(
    name: string,
    fn: (args: TArgs) => Promise<unknown>,
    { errorResult = {}, metric }: HandlerOptions = {}
  ) =>
  (args: TArgs, callback?: SmapiCallback): void => {
    const metricName = metric === undefined ? `sonos.wsdl.${name}` : metric;

    if (metricName) winston.I.increment(metricName);

    fn(args).then(
      (result) => callback?.(result),
      (err) => {
        winston.error(name, { err });
        callback?.(errorResult);
      }
    );
  };

type Pagination = { index?: number; count?: number };

// Sonos asks for a window of a list and wants the window plus the totals back.
export const paginate = <T>(
  items: T[],
  { index, count }: Pagination,
  kind: 'mediaCollection' | 'mediaMetadata' = 'mediaCollection'
) => {
  // Sonos always sends both bounds. If either is missing the arithmetic below
  // yields NaN and slice returns nothing, which is what has always happened.
  const end = (index ?? NaN) + (count ?? NaN);
  const results = items.slice(index, end);

  return {
    index,
    total: items.length,
    count: results.length,
    [kind]: results,
  };
};
