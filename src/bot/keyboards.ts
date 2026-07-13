import { Markup } from "telegraf";

export const mainKeyboard = Markup.keyboard([
  ["✍️ Создать пост", "📁 Черновики"],
  ["📰 Новости", "😄 Юмор"],
  ["🚀 Devlog", "ℹ️ Помощь"]
]).resize();

export function draftKeyboard(id: number) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ Опубликовать", `publish:${id}`)],
    [
      Markup.button.callback("🔄 Перегенерировать", `regen:${id}`),
      Markup.button.callback("🗑 Удалить", `delete:${id}`)
    ]
  ]);
}
