import { redisConnectionOptions } from "@/config/redis";
import { logger } from "@/shared/utils/logger";
import { Job, Worker } from "bullmq";
import { REPORT_QUEUE_NAME, ReportJobDto } from "../queues/report.queue";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportWorker = new Worker<ReportJobDto>(
  REPORT_QUEUE_NAME,
  async (job: Job<ReportJobDto>) => {
    const { reportId, userId, filters } = job.data;

    logger.info(
      `[Worker] Processing report job [${reportId}] for user [${userId}] with filters: ${JSON.stringify(
        filters,
      )}`,
    );

    // Simulate report generation time
    const totalSteps = 5;
    for (let step = 1; step <= totalSteps; step++) {
      logger.info(
        `📊 [Worker] Report [${reportId}] - Step ${step}/${totalSteps} in progress...`,
      );
      await delay(2000); // Simulate time-consuming task
    }

    logger.info(
      `✅ [Worker] Report [${reportId}] generated successfully for user [${userId}].`,
    );

    return {
      downloadUrl: `https://example.com/reports/${reportId}.xlsx`,
    };
  },
  {
    connection: redisConnectionOptions,
    concurrency: 2,
  },
);

reportWorker.on("completed", (job, result) => {
  logger.info(
    `🎉 [Worker] Job [${job.id}] completed. Result: ${JSON.stringify(result)}`,
  );
});

reportWorker.on("failed", (job, err) => {
  logger.error(`❌ [Worker] Job [${job?.id}] failed. Error: ${err.message}`);
});
