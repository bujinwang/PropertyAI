import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

collectDefaultMetrics();

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500], // buckets for response time from 0.1ms to 500ms
});

export const registerMetrics = () => {
  return register.metrics();
};

export const getContentType = () => {
  return register.contentType;
};
