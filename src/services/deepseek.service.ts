import { env } from "../config/env.js";
import type { GeneratedPost } from "../types/content.js";

const systemInstruction = `Ты — главный редактор Telegram-канала Channel OS Dev.
Channel OS — инструмент для владельцев Telegram-каналов: аналитика, планирование и управление контентом.
Пиши по-русски, живо, понятно и без канцелярита. Не выдумывай функции, цифры, даты и факты.
Не злоупотребляй эмодзи. Один пост — одна главная мысль.
Текст должен быть пригоден для публикации в Telegram и не должен содержать Markdown-таблиц.
Верни только JSON-объект строго такого вида:
{"title":"заголовок","body":"полный текст поста","visualIdea":"краткая идея изображения"}`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseGeneratedPost(raw: string): GeneratedPost {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as Partial<GeneratedPost>;

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.body !== "string" ||
    typeof parsed.visualIdea !== "string"
  ) {
    throw new Error("DeepSeek вернул JSON с неправильной структурой");
  }

  return {
    title: parsed.title.trim(),
    body: parsed.body.trim(),
    visualIdea: parsed.visualIdea.trim()
  };
}

async function requestDeepSeek(topic: string): Promise<GeneratedPost> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY не настроен");
  }

  const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Создай публикацию для Channel OS Dev на тему: ${topic}` }
      ],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1800,
      stream: false
    }),
    signal: AbortSignal.timeout(env.DEEPSEEK_TIMEOUT_MS)
  });

  const payload = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: string | null } }>; error?: { message?: string } }
    | null;

  if (!response.ok) {
    const message = payload?.error?.message ?? `HTTP ${response.status}`;
    const error = new Error(`DeepSeek API: ${message}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek вернул пустой ответ");

  return parseGeneratedPost(content);
}

function isRetryable(error: unknown): boolean {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

  return [429, 500, 502, 503, 504].includes(status ?? 0) || error instanceof TypeError;
}

export async function generatePostWithDeepSeek(topic: string): Promise<GeneratedPost> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= env.DEEPSEEK_MAX_RETRIES; attempt += 1) {
    try {
      console.log(`DeepSeek: генерация через ${env.DEEPSEEK_MODEL}, попытка ${attempt}/${env.DEEPSEEK_MAX_RETRIES}.`);
      return await requestDeepSeek(topic);
    } catch (error) {
      lastError = error;
      console.warn(`DeepSeek: ошибка — ${error instanceof Error ? error.message : String(error)}`);

      if (!isRetryable(error) || attempt === env.DEEPSEEK_MAX_RETRIES) break;

      const delay = 1800 * 2 ** (attempt - 1) + Math.floor(Math.random() * 700);
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("DeepSeek недоступен");
}
