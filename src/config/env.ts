import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  TZ: z.string().default("Europe/Tallinn"),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHANNEL_ID: z.string().min(1),
  TELEGRAM_OWNER_ID: z.coerce.number().int().positive(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_FALLBACK_MODEL: z.string().default("gemini-2.5-flash-lite"),
  GEMINI_SECOND_FALLBACK_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_MAX_RETRIES: z.coerce.number().int().min(1).max(8).default(4),
  DEEPSEEK_API_KEY: z.string().optional().default(""),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MAX_RETRIES: z.coerce.number().int().min(1).max(8).default(3),
  DEEPSEEK_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(45000),
  DATABASE_URL: z.string().min(1)
});

export const env = schema.parse(process.env);
