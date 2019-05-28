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


module.exports = {
  addZero,
  removeLeadingZero,
  createShowDate,
  splitShowDate,
  durationToHHMMSS,
  simplePluralize,
  getRandomLatestRecordingString,
};
