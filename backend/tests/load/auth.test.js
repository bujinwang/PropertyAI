import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const loginTrend = new Trend('login_duration');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{scenario:login}': ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  const url = 'http://localhost:5000/api/auth/login';
  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'password',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      scenario: 'login'
    }
  };

  const res = http.post(url, payload, params);
  loginTrend.add(res.timings.duration);
  check(res, {
    'login status was 200': (r) => r.status == 200,
  });
  sleep(1);
}
