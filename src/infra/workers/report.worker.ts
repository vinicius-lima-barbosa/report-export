import { redisClient, redisConnectionOptions } from "@/config/redis";
import { logger } from "@/shared/utils/logger";
import { Job, Worker } from "bullmq";
import { REPORT_QUEUE_NAME, ReportJobDto } from "../queues/report.queue";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportWorker = new Worker<ReportJobDto>(
  REPORT_QUEUE_NAME,
  async (job: Job<ReportJobDto>) => {
    const { reportId, userId } = job.data;

    // Simulate report generation time
    const totalSteps = 5;
    for (let step = 1; step <= totalSteps; step++) {
      const progress = step * 20;
      await delay(1500);

      await job.updateProgress(progress);

      await redisClient.publish(
        "report_updates",
        JSON.stringify({
          reportId,
          status: "PROCESSING",
          progress,
        }),
      );
    }

    const fakeDownloadUrl = `https://exemplo.supabase.co/storage/v1/object/authenticated/reports/${reportId}.csv`;

    await redisClient.publish(
      "report_updates",
      JSON.stringify({
        reportId,
        status: "COMPLETED",
        progress: 100,
        downloadUrl: fakeDownloadUrl,
      }),
    );

    return {
      downloadUrl: fakeDownloadUrl,
    };
  },
  {
    connection: redisConnectionOptions,
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
