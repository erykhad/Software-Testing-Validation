const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const email = 'perf@example.com';
const password = 'perf-password-123';

function cookieFrom(response) {
  const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const session = cookies.find((entry) => entry.startsWith('session='));
  if (!session) {
    throw new Error('Logowanie nie ustawiło ciasteczka sesji. Czy API działa?');
  }
  return session.split(';')[0];
}

async function auth() {
  const register = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: 'Perf' }),
  });
  if (register.status === 409) {
    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!login.ok) throw new Error(await login.text());
    return cookieFrom(login);
  }
  if (!register.ok) throw new Error(await register.text());
  return cookieFrom(register);
}

async function main() {
  const cookie = await auth();
  const headers = { cookie, 'content-type': 'application/json' };
  let itemId = '';
  let listId = '';

  for (let listIndex = 1; listIndex <= 5; listIndex += 1) {
    const listResponse = await fetch(`${base}/api/lists`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: `Perf ${listIndex}`, plannedDate: '2026-10-20' }),
    });
    if (!listResponse.ok) throw new Error(await listResponse.text());
    const list = await listResponse.json();
    listId = list.id;
    for (let itemIndex = 1; itemIndex <= 10; itemIndex += 1) {
      const itemResponse = await fetch(`${base}/api/lists/${list.id}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `produkt-${listIndex}-${itemIndex}`, quantity: itemIndex, unit: 'szt' }),
      });
      if (!itemResponse.ok) throw new Error(await itemResponse.text());
      const item = await itemResponse.json();
      itemId = item.id;
    }
  }

  const output = { email, password, listId, itemId };
  await import('node:fs/promises').then((fs) =>
    fs.writeFile(new URL('./seed-output.json', import.meta.url), JSON.stringify(output, null, 2)),
  );
  console.log(`Zapisano dane wydajnościowe dla ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
