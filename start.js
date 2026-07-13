const { spawnSync } = require('node:child_process');

const REQUIRED_SCHEMA = 'channel_os_dev_agent';

function sanitizeDatabaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('DATABASE_URL is not configured in BotHost environment variables.');
  }

  let cleaned = value.trim();

  // BotHost users sometimes paste DATABASE_URL=... into the value field.
  cleaned = cleaned.replace(/^DATABASE_URL\s*=\s*/i, '').trim();

  // Remove one pair of wrapping quotes copied from .env files.
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Remove accidental line breaks and surrounding whitespace.
  cleaned = cleaned.replace(/[\r\n]/g, '').trim();

  // If extra text was pasted before the URL, keep the PostgreSQL URL itself.
  const protocolIndex = cleaned.search(/postgres(?:ql)?:\/\//i);
  if (protocolIndex > 0) {
    cleaned = cleaned.slice(protocolIndex);
  }

  if (!/^postgres(?:ql)?:\/\//i.test(cleaned)) {
    throw new Error(
      'DATABASE_URL has an invalid format. In BotHost, enter only the value beginning with postgresql:// — without DATABASE_URL= and without quotes.'
    );
  }

  return cleaned;
}

function forceDatabaseSchema(rawValue) {
  const cleaned = sanitizeDatabaseUrl(rawValue);

  try {
    const url = new URL(cleaned);
    url.searchParams.set('schema', REQUIRED_SCHEMA);
    return url.toString();
  } catch (error) {
    throw new Error(
      `DATABASE_URL could not be parsed as a PostgreSQL URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

let databaseUrl;
try {
  databaseUrl = forceDatabaseSchema(process.env.DATABASE_URL);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

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
