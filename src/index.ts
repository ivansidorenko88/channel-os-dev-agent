import { bot } from "./bot/bot.js";
import { prisma } from "./services/prisma.js";

async function main() {
  await prisma.$connect();
  await bot.launch();
  console.log("Channel OS Dev Agent v0.1 started");
}

async function shutdown(signal: string) {
  console.log(`${signal}: graceful shutdown`);
  bot.stop(signal);
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
