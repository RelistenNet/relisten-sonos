const { firstBy } = require('thenby');

const addZero = (str = '') => {
  const int = parseInt(str, 10);

  if (int < 10) return '0' + String(int);
  return String(int);
};

const removeLeadingZero = (str = '') => {
  const int = parseInt(str, 10);

  return String(int);
};

const createShowDate = (year, month, day) => {
  return `${year}-${addZero(month)}-${addZero(day)}`;
};

const splitShowDate = (showDate = '') => {
  const [year, month, day] = showDate.split('-');

  return { year, month, day };
};

const durationToHHMMSS = duration => {
  const prefix = duration < 0 ? '-' : '';
  let totalSeconds = Math.abs(duration);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60) || 0;
  const seconds = Math.floor(totalSeconds % 60) || 0;


  return prefix + [hours, hours ? addZero(minutes) : String(minutes), addZero(seconds)].filter(x => x).join(':');
};

const simplePluralize = (str, count) => {
  return `${count} ${count === 1 ? str : str + 's'}`;
};

const RECORDING_STRINGS = [
  'Newfangled %s',
  'Untrodden %s',
  'Extra-Virgin First-Press %s',
  'Topical %s',
  'Ultramodern %s',
  'Au Courant %s',
  'Neu! %s',
  'New %s',
  'Latest %s',
  '%s à la mode',
].map(x => x.replace('%s', 'Recordings'));

const getRandomLatestRecordingString = () => RECORDING_STRINGS[Math.floor(Math.random() * RECORDING_STRINGS.length)];

const getEtreeId = (s = '') => Number(s.split('.').reverse().find(x => /^[0-9]+$/.test(x)));

// tapes: TODO: GD sort (charlie miller, sbd + etree id, weighted average), sbd + etree id, weighted avg, asc, desc
// for now, hardcode sort: sbd, charlie miller, etree id, weighted average
const sortTapes = (sources = []) => {
  const sortedTapes = [...sources].sort(
    firstBy(t => t.is_soundboard)
    // Charlie for GD, Pete for JRAD
      .thenBy(t => /(charlie miller)|(peter costello)/i.test([t.taper, t.transferrer, t.source].join('')))
      .thenBy((t1, t2) => getEtreeId(t1.upstream_identifier) - getEtreeId(t2.upstream_identifier))
      .thenBy(t => t.avg_rating_weighted)
  );

  return sortedTapes.reverse();
};

module.exports = {
  addZero,
  removeLeadingZero,
  createShowDate,
  splitShowDate,
  durationToHHMMSS,
  simplePluralize,
  getRandomLatestRecordingString,
  sortTapes,
};
