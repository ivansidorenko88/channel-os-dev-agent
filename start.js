const { spawnSync } = require("node:child_process");

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function validateDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is not configured in BotHost environment variables.");
    process.exit(1);
  }

  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    console.error("DATABASE_URL has an invalid format.");
    process.exit(1);
  }

  const schema = url.searchParams.get("schema");
  if (schema !== "channel_os_dev_agent") {
    console.error(
      'DATABASE_URL must end with "?schema=channel_os_dev_agent". ' +
      `Current schema: ${schema ?? "public"}`
    );
    process.exit(1);
  }

  console.log(`Database schema: ${schema}`);
}

validateDatabaseUrl();

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
run(npx, ["prisma", "generate", "--schema=prisma/schema.prisma"]);
run(npx, ["prisma", "db", "push", "--schema=prisma/schema.prisma"]);
run(npx, ["tsx", "src/index.ts"]);
