const { spawnSync } = require('node:child_process');

function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
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
