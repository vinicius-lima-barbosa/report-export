import app from "./app";
import { env } from "./config/env";
import { logger } from "./shared/utils/logger";

const PORT = parseInt(env.PORT, 10);

async function bootstrap() {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info("[Server] Server closed successfully");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

bootstrap();
