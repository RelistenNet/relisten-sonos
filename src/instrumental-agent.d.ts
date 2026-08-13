// instrumental-agent ships no types; this covers the surface we call.
// See node_modules/instrumental-agent/lib/instrumental.js.
declare module 'instrumental-agent' {
  interface InstrumentalOptions {
    apiKey?: string | undefined;
    enabled?: boolean | undefined;
    host?: string | undefined;
    timeout?: number | undefined;
  }

  interface InstrumentalAgent {
    configure(options: InstrumentalOptions): void;
    increment(metric: string, value?: number, time?: number, count?: number): void;
    gauge(metric: string, value: number, time?: number, count?: number): void;
    notice(description: string, time?: number, duration?: number): void;
  }

  const agent: InstrumentalAgent;

  export = agent;
}
