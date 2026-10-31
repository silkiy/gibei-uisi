import assert from 'node:assert/strict';

export function fixtureAccounts(env = process.env) {
  const accounts = JSON.parse(env.GIBEI_TEST_ACCOUNTS || 'null');
  assert.ok(accounts?.admin && accounts?.mediaA && accounts?.mediaB, 'Run through the isolated test launcher');
  return accounts;
}

/**
 * @param {string} baseURL
 * @param {string=} cookie
 * @returns {(path: string, options?: {method?: string, data?: unknown, bytes?: Uint8Array, headers?: Record<string, string>}) => Promise<Response>}
 */
export function httpClient(baseURL, cookie) {
  const base = new URL(baseURL);
  assert.equal(base.hostname, '127.0.0.1');
  return async (path, { method = 'GET', data, bytes, headers = {} } = {}) => {
    assert.ok(path.startsWith('/') && !path.startsWith('//'), 'Only relative application paths allowed');
    return fetch(new URL(path, base), { method, redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { 'Content-Type': 'application/json', Origin: base.origin, ...(cookie ? { Cookie: cookie } : {}), ...headers },
      ...(data === undefined ? (bytes === undefined ? {} : { body: bytes }) : { body: JSON.stringify(data) }) });
  };
}

export async function authenticate(account, baseURL = process.env.SERVER_URL) {
  const response = await httpClient(baseURL)('/api/users/login', { method: 'POST', data: { email: account.email, password: account.password } });
  assert.equal(response.status, 200, 'Fixture login must succeed');
  const body = await response.json();
  const cookie = response.headers.getSetCookie().find(value => value.startsWith('payload-token='))?.split(';')[0];
  assert.ok(cookie, 'Fixture login must issue a cookie');
  assert.ok(body.token === undefined, 'Token must not be returned in JSON');
  return { user: body.user, request: httpClient(baseURL, cookie) };
}
