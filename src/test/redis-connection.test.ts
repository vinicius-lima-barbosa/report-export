import { redisClient } from "@/config/redis";
import { logger } from "@/shared/utils/logger";

async function testConnection() {
  logger.info("⏳ Starting Redis connection test...");

  try {
    await redisClient.set("test_key", "Redis is working!", "EX", 10);
    logger.info("✅ Key saved successfully!");

    const value = await redisClient.get("test_key");
    logger.info(`📖 Value read from Redis: "${value}"`);

    if (value === "Redis is working!") {
      logger.info(
        "🚀 Absolute success! The connection is stable and ready for BullMQ.",
      );
    } else {
      logger.error("⚠️ The returned value is not what we expected.");
    }
  } catch {
    logger.error("💥 Catastrophic failure in Redis test");
  } finally {
    await redisClient.quit();
    logger.info("🔌 Connection closed.");
    process.exit(0);
  }
}

testConnection();
