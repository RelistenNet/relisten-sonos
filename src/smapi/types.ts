// SMAPI request args come off the SOAP wire untyped, and Sonos is free to omit
// any of them, so every field is optional. These are the only ones any of our
// verbs read.
export interface SmapiArgs {
  id?: string;
  index?: number;
  count?: number;
  term?: string;
  seconds?: number;
}

// node-soap's ISoapServiceMethod declares the callback as optional — a handler
// may answer synchronously by returning a value instead of calling back.
export type SmapiCallback = (result: unknown) => void;
