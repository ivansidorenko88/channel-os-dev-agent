import { Telegraf } from "telegraf";
import { ContentType } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";
import { generatePost } from "../services/gemini.service.js";
import { draftKeyboard, mainKeyboard } from "./keyboards.js";

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
const waitingForTopic = new Set<number>();

function isOwner(userId?: number): boolean {
  return userId === env.TELEGRAM_OWNER_ID;
}

function formatPost(title: string, body: string): string {
  return `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(body)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function createAndShowDraft(ctx: any, topic: string, type: ContentType = ContentType.MANUAL) {
  await ctx.reply("Генерирую черновик…");
  const generated = await generatePost(topic);
  const draft = await prisma.contentDraft.create({
    data: { type, topic, ...generated }
  });

  const message = await ctx.reply(
    `${formatPost(draft.title, draft.body)}\n\n<b>Идея визуала:</b> ${escapeHtml(draft.visualIdea ?? "—")}`,
    { parse_mode: "HTML", ...draftKeyboard(draft.id) }
  );

  await prisma.contentDraft.update({
    where: { id: draft.id },
    data: { telegramMessageId: message.message_id }
  });
}

bot.use(async (ctx, next) => {
  if (!isOwner(ctx.from?.id)) {
    await ctx.reply("Доступ к агенту закрыт.");
    return;
  }
  await next();
});

bot.start((ctx) => ctx.reply("Channel OS Dev Agent v0.1 запущен.", mainKeyboard));
bot.command("post", async (ctx) => {
  const topic = ctx.message.text.replace(/^\/post(@\w+)?\s*/i, "").trim();
  if (!topic) return ctx.reply("Использование: /post тема публикации");
  await createAndShowDraft(ctx, topic);
});

bot.hears("✍️ Создать пост", (ctx) => {
  waitingForTopic.add(ctx.from.id);
  return ctx.reply("Отправь тему будущей публикации одним сообщением.");
});

bot.hears("📰 Новости", (ctx) => createAndShowDraft(ctx, "Объясни важную актуальную новость из мира ИИ или IT. Не придумывай факты: если свежие данные не предоставлены, создай только шаблон и укажи, какие источники нужно проверить.", ContentType.NEWS));
bot.hears("😄 Юмор", (ctx) => createAndShowDraft(ctx, "Добрая короткая шутка или мем про владельцев Telegram-каналов, разработку или нейросети", ContentType.HUMOR));
bot.hears("🚀 Devlog", (ctx) => createAndShowDraft(ctx, "Шаблон devlog Channel OS без выдуманных обновлений, с местами для подтверждённых изменений", ContentType.DEVLOG));

bot.hears("📁 Черновики", async (ctx) => {
  const drafts = await prisma.contentDraft.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  if (!drafts.length) return ctx.reply("Черновиков пока нет.");
  return ctx.reply(drafts.map((d) => `#${d.id} — ${d.title}`).join("\n"));
});

bot.hears("ℹ️ Помощь", (ctx) => ctx.reply("/post <тема> — создать публикацию\nТакже можно использовать кнопки меню."));

bot.on("text", async (ctx) => {
  if (!waitingForTopic.delete(ctx.from.id)) return;
  await createAndShowDraft(ctx, ctx.message.text.trim());
});

bot.action(/^publish:(\d+)$/, async (ctx) => {
  const id = Number(ctx.match[1]);
  const draft = await prisma.contentDraft.findUnique({ where: { id } });
  if (!draft || draft.status !== "DRAFT") return ctx.answerCbQuery("Черновик уже обработан");

  const published = await ctx.telegram.sendMessage(
    env.TELEGRAM_CHANNEL_ID,
    formatPost(draft.title, draft.body),
    { parse_mode: "HTML" }
  );

  await prisma.contentDraft.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedMessageId: published.message_id }
  });
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.answerCbQuery("Опубликовано");
});

bot.action(/^regen:(\d+)$/, async (ctx) => {
  const id = Number(ctx.match[1]);
  const draft = await prisma.contentDraft.findUnique({ where: { id } });
  if (!draft) return ctx.answerCbQuery("Черновик не найден");
  await ctx.answerCbQuery("Создаю новый вариант");
  await createAndShowDraft(ctx, draft.topic, draft.type);
});

bot.action(/^delete:(\d+)$/, async (ctx) => {
  const id = Number(ctx.match[1]);
  await prisma.contentDraft.update({ where: { id }, data: { status: "REJECTED" } });
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await ctx.answerCbQuery("Удалено");
});

bot.catch((error) => console.error("Telegram bot error:", error));
