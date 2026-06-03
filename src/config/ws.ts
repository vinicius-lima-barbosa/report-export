import { logger } from "@/shared/utils/logger";
import { Server as HttpServer } from "http";
import Redis from "ioredis";
import { WebSocket, WebSocketServer } from "ws";
import { env } from "./env";
``;

const reportSubscription = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    logger.info("📱 WebSocket connection established");

    let currentReportId: string | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "SUBSCRIBE_REPORT" && data.reportId) {
          currentReportId = data.reportId;

          if (!reportSubscription.has(currentReportId!)) {
            reportSubscription.set(currentReportId!, new Set());
          }

          reportSubscription.get(currentReportId!)!.add(ws);
          logger.info(`🔔 WebSocket subscribed to report ${currentReportId}`);
        }
      } catch (error) {
        logger.error("❌ Error processing WebSocket message");
      }
    });

    ws.on("close", () => {
      if (currentReportId && reportSubscription.has(currentReportId)) {
        const subs = reportSubscription.get(currentReportId)!;
        subs.delete(ws);
        if (subs?.size === 0) {
          reportSubscription.delete(currentReportId);
        }
      }

      logger.info(`🔕 WebSocket unsubscribed from report ${currentReportId}`);
    });
  });

  const redisSubscriber = new Redis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
  });

  redisSubscriber.subscribe("report_updates", (err) => {
    if (err) {
      logger.error("❌ Failed to subscribe to Redis channel");
    } else {
      logger.info("✅ Subscribed to Redis channel: report_updates");
    }
  });

  redisSubscriber.on("message", (channel, message) => {
    if (channel === "report_updates") {
      const { reportId, status, progress } = JSON.parse(message);

      const clients = reportSubscription.get(reportId);

      if (clients && clients.size > 0) {
        const payload = JSON.stringify({
          type: "REPORT_PROGRESS",
          status,
          progress,
        });

        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    }
  });
}
