import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<5000'], // R95 <5s
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000/api/marketplace';
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer mock-jwt', // Use env for real
};

export default () => {
  const payload = JSON.stringify({
    tenantId: `tenant-${__VU}-${Math.random().toString(36).substr(2, 9)}`,
    propertyIds: ['prop1', 'prop2', 'prop3'], // 3 properties for load
  });

  const res = http.post(`${BASE_URL}/match`, payload, { headers });

  check(res, {
    'status 200': (r) => r.status === 200,
    'matches length >=1': (r) => r.json('matches.length') >= 1,
  });

  sleep(1);
};