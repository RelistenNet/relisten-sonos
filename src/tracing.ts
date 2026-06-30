import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ParentBasedSampler,
  Sampler,
  SamplingDecision,
  SamplingResult,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api';

const staticExtensions = ['.js', '.css', '.map', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2'];
const ignoredPathPrefixes = ['/static/'];

function shouldIgnorePath(path: string): boolean {
  if (path === '/') return true;
  if (ignoredPathPrefixes.some((prefix) => path.startsWith(prefix))) return true;

  const pathWithoutQuery = path.split('?')[0];
  return staticExtensions.some((extension) => pathWithoutQuery.endsWith(extension));
}

class NoiseFilterSampler implements Sampler {
  constructor(private readonly baseSampler: Sampler) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[]
  ): SamplingResult {
    const path = (attributes['http.target'] ?? attributes['url.path']) as string | undefined;
    if (path && shouldIgnorePath(path)) return { decision: SamplingDecision.NOT_RECORD };
    return this.baseSampler.shouldSample(context, traceId, spanName, spanKind, attributes, links);
  }

  toString(): string {
    return `NoiseFilterSampler{${this.baseSampler.toString()}}`;
  }
}

function parseHeaders(env?: string): Record<string, string> {
  if (!env) return {};

  const headers: Record<string, string> = {};
  for (const pair of env.split(',')) {
    const [key, ...value] = pair.split('=');
    if (key && value.length) headers[key.trim()] = value.join('=').trim();
  }
  return headers;
}

function getTracesEndpoint(): string | undefined {
  if (process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    return process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  }

  const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!baseEndpoint) return undefined;
  return `${baseEndpoint.replace(/\/$/, '')}/v1/traces`;
}

const tracesEndpoint = getTracesEndpoint();

if (tracesEndpoint) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'relisten-sonos' }),
    traceExporter: new OTLPTraceExporter({
      url: tracesEndpoint,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    }),
    sampler: new NoiseFilterSampler(
      new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(0.05) })
    ),
    logRecordProcessors: [],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => shouldIgnorePath(request.url ?? ''),
      }),
      new UndiciInstrumentation(),
    ],
  });

  sdk.start();

  const shutdown = () => {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
    Promise.race([sdk.shutdown(), timeout])
      .catch(console.error)
      .finally(() => process.exit(0));
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
