import http from 'k6/http';
import { check, sleep } from 'k6';

const seed = JSON.parse(open('./seed-output.json'));
const base = __ENV.BASE_URL || 'http://127.0.0.1:3000';

export const options = {
  scenarios: {
    login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 4 },
        { duration: '10s', target: 4 },
        { duration: '5s', target: 0 },
      ],
      exec: 'login',
    },
    browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 15 },
        { duration: '10s', target: 30 },
        { duration: '5s', target: 0 },
      ],
      exec: 'browse',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

export function setup() {
  const login = http.post(
    `${base}/api/auth/login`,
    JSON.stringify({ email: seed.email, password: seed.password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const token = login.cookies.session?.[0]?.value;
  if (!token) throw new Error(`Logowanie nie powiodło się: ${login.status} ${login.body}`);
  return { token };
}

export function login() {
  const response = http.post(
    `${base}/api/auth/login`,
    JSON.stringify({ email: seed.email, password: seed.password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } },
  );
  check(response, { 'login 200': (result) => result.status === 200 });
  sleep(0.2);
}

export function browse(data) {
  const headers = { Cookie: `session=${data.token}` };
  const lists = http.get(`${base}/api/lists`, { headers, tags: { name: 'lists' } });
  check(lists, { 'lists 200': (response) => response.status === 200 });
  const status = http.patch(
    `${base}/api/items/${seed.itemId}/status`,
    JSON.stringify({ isPurchased: __ITER % 2 === 0 }),
    { headers: { ...headers, 'Content-Type': 'application/json' }, tags: { name: 'status' } },
  );
  check(status, { 'status 200': (response) => response.status === 200 });
  sleep(0.1);
}
