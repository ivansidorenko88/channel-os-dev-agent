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
  GEMINI_MAX_RETRIES: z.coerce.number().int().min(1).max(8).default(4),
  DATABASE_URL: z.string().min(1)
});

export const env = schema.parse(process.env);
