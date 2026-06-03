import { db } from "@/config/database";
import { redisClient, redisConnectionOptions } from "@/config/redis";
import { logger } from "@/shared/utils/logger";
import { Job, Worker } from "bullmq";
import { REPORT_QUEUE_NAME, ReportJobDto } from "../queues/report.queue";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportWorker = new Worker<ReportJobDto>(
  REPORT_QUEUE_NAME,
  async (job: Job<ReportJobDto>) => {
    const { reportId } = job.data;

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

    // Fale variables for demonstration purposes
    const fakeStoragePath = `reports/user_abc123/${reportId}.csv`;
    const fakeDownloadUrl = `https://exemplo.supabase.co/storage/v1/object/authenticated/reports/${reportId}.csv`;

    await db.query(
      `
        UPDATE reports SET status = 'COMPLETED', storage_path = $1, updated_at = NOW() WHERE id = $2
      `,
      [fakeStoragePath, reportId],
    );

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
    concurrency: 2,
  },
);

reportWorker.on("completed", (job, result) => {
  logger.info(
    `🎉 [Worker] Job [${job.id}] completed. Result: ${JSON.stringify(result)}`,
  );
});

reportWorker.on("failed", async (job, err) => {
  logger.error(`❌ [Worker] Job [${job?.id}] failed. Error: ${err.message}`);

  if (job) {
    const { reportId } = job.data;

    await db.query(
      `
        UPDATE reports SET status = 'FAILED', error_message = $1, updated_at = NOW() WHERE id = $2
      `,
      [err.message, reportId],
    );

    await redisClient.publish(
      "report_updates",
      JSON.stringify({
        reportId,
        status: "FAILED",
        progress: job.progress,
        error: err.message,
      }),
    );
  }
});
