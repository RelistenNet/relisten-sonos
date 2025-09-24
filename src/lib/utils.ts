import * as thenby from 'thenby';

type Source = {
  is_soundboard: boolean;
  taper: string;
  transferrer: string;
  source: string;
  upstream_identifier: string;
  avg_rating_weighted: number;
};

const addZero = (str = '') => {
  const int = parseInt(str, 10);

  if (int < 10) return '0' + String(int);
  return String(int);
};

const removeLeadingZero = (str = '') => {
  const int = parseInt(str, 10);

  return String(int);
};

const createShowDate = (year: string, month: string, day: string) => {
  return `${year}-${addZero(month)}-${addZero(day)}`;
};

const splitShowDate = (showDate = '') => {
  const [year, month, day] = showDate.split('-');

  return { year, month, day };
};

const durationToHHMMSS = (duration: number) => {
  const prefix = duration < 0 ? '-' : '';
  let totalSeconds = Math.abs(duration);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60) || 0;
  const seconds = Math.floor(totalSeconds % 60) || 0;

  return (
    prefix +
    [hours, hours ? addZero(String(minutes)) : String(minutes), addZero(String(seconds))]
      .filter((x) => x)
      .join(':')
  );
};

const simplePluralize = (str: string, count: number) => {
  return `${count} ${count === 1 ? str : str + 's'}`;
};

const getEtreeId = (s = '') =>
  Number(
    s
      .split('.')
      .reverse()
      .find((x) => /^[0-9]+$/.test(x))
  );

// tapes: TODO: GD sort (charlie miller, sbd + etree id, weighted average), sbd + etree id, weighted avg, asc, desc
// for now, hardcode sort: sbd, charlie miller, etree id, weighted average
const sortTapes = (sources = []) => {
  const sortedTapes = [...sources].sort(
    thenby
      .firstBy((t: Source) => t.is_soundboard)
      // Charlie for GD, Pete for JRAD
      .thenBy((t: Source) =>
        /(charlie miller)|(peter costello)/i.test([t.taper, t.transferrer, t.source].join(''))
      )
      .thenBy(
        (t1: Source, t2: Source) =>
          getEtreeId(t1.upstream_identifier) - getEtreeId(t2.upstream_identifier)
      )
      .thenBy((t: Source) => t.avg_rating_weighted)
  );

  return sortedTapes.reverse();
};

export {
  addZero,
  removeLeadingZero,
  createShowDate,
  splitShowDate,
  durationToHHMMSS,
  simplePluralize,
  sortTapes,
};
