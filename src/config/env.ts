import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  CORS_ORIGIN: z.string().default("*"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_HOST: z.string().default("localhost"),
  DB_USER: z.string().default("postgres"),
  DB_HOST: z.string().default("localhost"),
  DB_NAME: z.string().default("report_export_db"),
  DB_PASSWORD: z.string().default("postgres"),
  DB_PORT: z.string().default("5432"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
