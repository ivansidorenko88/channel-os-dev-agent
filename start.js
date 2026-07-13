const { spawnSync } = require('node:child_process');

const REQUIRED_SCHEMA = 'channel_os_dev_agent';

function forceDatabaseSchema(rawUrl) {
  if (!rawUrl) {
    console.error('DATABASE_URL is not configured in BotHost environment variables.');
    process.exit(1);
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    console.error('DATABASE_URL has an invalid PostgreSQL URL format.');
    process.exit(1);
  }

  url.searchParams.set('schema', REQUIRED_SCHEMA);
  return url.toString();
}

const databaseUrl = forceDatabaseSchema(process.env.DATABASE_URL);
const childEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log(`Database schema forced to: ${REQUIRED_SCHEMA}`);

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: childEnv
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

run(npx, ['prisma', 'generate', '--schema=prisma/schema.prisma']);
run(npx, ['prisma', 'db', 'push', '--schema=prisma/schema.prisma']);
run(npx, ['tsx', 'src/index.ts']);
