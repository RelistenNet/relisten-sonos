const apiBaseUrl = (
  process.env.RELISTEN_API_BASE_URL ||
  process.env.RELISTEN_API_URL ||
  'https://api.relisten.net'
).replace(/\/$/, '');

export const API_V2_ROOT = `${apiBaseUrl}/api/v2`;
export const API_V3_ROOT = `${apiBaseUrl}/api/v3`;
