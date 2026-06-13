const baseUrl = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const checks = [
  '/',
  '/about',
  '/products',
  '/services',
  '/contact',
  '/join',
  '/pahs',
  '/admin',
  '/api/health',
];

let failures = 0;

console.log(`Running Latimore Hub smoke tests against ${baseUrl}`);

for (const path of checks) {
  const url = new URL(path, baseUrl).toString();
  try {
    const response = await fetch(url, { redirect: 'manual' });
    const acceptable = response.status >= 200 && response.status < 400;
    console.log(`${acceptable ? 'PASS' : 'FAIL'} ${path} ${response.status}`);
    if (!acceptable) failures++;
  } catch (error) {
    failures++;
    console.error(`FAIL ${path}`, error.message);
  }
}

if (failures) {
  console.error(`${failures} smoke test(s) failed.`);
  process.exit(1);
}

console.log('Smoke tests passed.');
