import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env.js";
import type { GeneratedPost } from "../types/content.js";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const systemInstruction = `Ты — главный редактор Telegram-канала Channel OS Dev.
Channel OS — инструмент для владельцев Telegram-каналов: аналитика, планирование и управление контентом.
Пиши по-русски, живо, понятно и без канцелярита. Не выдумывай функции, цифры, даты и факты.
Не злоупотребляй эмодзи. Один пост — одна главная мысль.
Текст должен быть пригоден для публикации в Telegram и не должен содержать Markdown-таблиц.
Верни заголовок, полный текст поста и краткую идею изображения.`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

function isRetryable(error: unknown): boolean {
  return [429, 500, 502, 503, 504].includes(getStatus(error) ?? 0);
}

async function requestPost(model: string, topic: string): Promise<GeneratedPost> {
  const response = await ai.models.generateContent({
    model,
    contents: `Создай публикацию для Channel OS Dev на тему: ${topic}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          visualIdea: { type: Type.STRING }
        },
        required: ["title", "body", "visualIdea"]
      }
    }
  });

  if (!response.text) throw new Error("Gemini вернул пустой ответ");

  try {
    return JSON.parse(response.text) as GeneratedPost;
  } catch {
    throw new Error("Gemini вернул некорректный JSON");
  }
}

async function generateWithRetry(model: string, topic: string): Promise<GeneratedPost> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= env.GEMINI_MAX_RETRIES; attempt += 1) {
    try {
      return await requestPost(model, topic);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === env.GEMINI_MAX_RETRIES) break;

      const delay = 1500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 700);
      console.warn(`Gemini ${model} недоступен. Попытка ${attempt}/${env.GEMINI_MAX_RETRIES}; повтор через ${delay} мс.`);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function generatePost(topic: string): Promise<GeneratedPost> {
  try {
    return await generateWithRetry(env.GEMINI_MODEL, topic);
  } catch (error) {
    if (!isRetryable(error) || env.GEMINI_FALLBACK_MODEL === env.GEMINI_MODEL) throw error;
    console.warn(`Переключение с ${env.GEMINI_MODEL} на ${env.GEMINI_FALLBACK_MODEL}.`);
    return generateWithRetry(env.GEMINI_FALLBACK_MODEL, topic);
  }
}
