import { redisConnectionOptions } from "@/config/redis";
import { logger } from "@/shared/utils/logger";
import { Queue } from "bullmq";

export interface ReportJobDto {
  reportId: string;
  userId: string;
  filters: {
    startDate: string;
    endDate: string;
    category?: string;
  };
}

const REPORT_QUEUE_NAME = "report-queue";

export const reportQueue = new Queue<ReportJobDto>(REPORT_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

logger.info(
  `🚀 Queue [${REPORT_QUEUE_NAME}] initialized and ready to receive jobs.`,
);
