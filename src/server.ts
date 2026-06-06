import server, { wss } from "./app";
import { env } from "./config/env";
import { redisClient } from "./config/redis";
import { logger } from "./shared/utils/logger";

const PORT = parseInt(env.PORT, 10);

async function bootstrap() {
  const sserver = server.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
    sserver.close(async () => {
      logger.info("[Server] Server closed successfully");

      if (wss && typeof wss.close === "function") {
        wss.close(() => {
          logger.info("[Server] WebSocket server closed.");
        });
      }

      try {
        await redisClient.quit();
        logger.info("[Server] Redis connection closed successfully.");
      } catch {
        logger.error("[Server] Error closing Redis connection");
      }

      logger.info("[Server] Shutdown complete. Goodbye!");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("[Server] Forced shutdown due to timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

bootstrap();
