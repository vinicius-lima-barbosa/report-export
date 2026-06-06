import { env } from "@/config/env";
import pino from "pino";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:dd/mm/yyyy HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
