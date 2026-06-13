const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ADMIN_EMAILS',
];

const recommended = [
  'NEXT_PUBLIC_BASE_URL',
  'RESEND_API_KEY',
  'NOTIFY_TO',
  'THANKYOU_FROM',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FILLOUT_SECRET',
  'BOOKING_WEBHOOK_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

console.log('Latimore Hub preflight');
console.log('Required env present:', required.length - missingRequired.length, '/', required.length);
console.log('Recommended env present:', recommended.length - missingRecommended.length, '/', recommended.length);

if (missingRecommended.length) {
  console.warn('Missing recommended env:', missingRecommended.join(', '));
}

if (missingRequired.length) {
  console.error('Missing required env:', missingRequired.join(', '));
  process.exit(1);
}

console.log('Preflight passed.');
