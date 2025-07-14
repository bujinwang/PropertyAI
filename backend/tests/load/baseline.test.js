import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const myTrend = new Trend('my_trend');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:5000/api/health');
  myTrend.add(res.timings.duration);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
