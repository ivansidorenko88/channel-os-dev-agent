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

export async function generatePost(topic: string): Promise<GeneratedPost> {
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
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
  return JSON.parse(response.text) as GeneratedPost;
}
