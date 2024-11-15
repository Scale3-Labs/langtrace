require('dotenv').config();
const { execSync } = require('child_process');

// Always run migrations
console.log('Running migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

// Only run Clickhouse setup if SKIP_CLICKHOUSE is not true
if (process.env.SKIP_CLICKHOUSE !== 'true') {
  console.log('Setting up Clickhouse...');
  execSync('npx tsx scripts/create-clickhouse-db.ts', { stdio: 'inherit' });
} else {
  console.log('Skipping Clickhouse setup...');
}
