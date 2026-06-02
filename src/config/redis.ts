import { logger } from "@/shared/utils/logger";
import { ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { env } from "./env";

const REDIS_PORT = Number(env.REDIS_PORT) || 6379;
const REDIS_HOST = env.REDIS_HOST || "localhost";

export const redisConnectionOptions: ConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

redisClient.on("connect", () =>
  logger.info("🔌 Redis connected successfully!"),
);
redisClient.on("error", () => logger.error("❌ Error connecting to Redis:"));
