import { db } from "@/config/database";
import { redisClient, redisConnectionOptions } from "@/config/redis";
import { supabase } from "@/config/supabase";
import { AppError } from "@/shared/errors/app-error";
import { logger } from "@/shared/utils/logger";
import { Job, Worker } from "bullmq";
import { REPORT_QUEUE_NAME, ReportJobDto } from "../queues/report.queue";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const reportWorker = new Worker<ReportJobDto>(
  REPORT_QUEUE_NAME,
  async (job: Job<ReportJobDto>) => {
    const { reportId, userId, filters } = job.data;

    for (let step = 1; step <= 4; step++) {
      const progress = step * 20;
      await delay(1500);
      await job.updateProgress(progress);

      await db.query(
        `
        UPDATE reports SET status = 'PROCESSING', progress = $1, updated_at = NOW() WHERE id = $2
        `,
        [progress, reportId],
      );

      await redisClient.publish(
        "report_updates",
        JSON.stringify({
          reportId,
          status: "PROCESSING",
          progress,
        }),
      );
    }

    const csvHeader = "ID;Data;Category;Value\n";
    const csvRows = [
      `1;2026-05-01;${filters.category || "All"};150.00`,
      `2;2026-05-15;${filters.category || "All"};420.50`,
      `3;2026-05-28;${filters.category || "All"};90.00`,
    ].join("\n");
    const csvContent = csvHeader + csvRows;

    const fileBuffer = Buffer.from(csvContent, "utf-8");
    const storagePath = `${userId}/${reportId}.csv`;

    // Upload to Supabase
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(storagePath, fileBuffer, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(
        `Failed to upload to storage: ${uploadError.message}`,
        400,
      );
    }

    await db.query(
      `
        UPDATE reports SET status = 'COMPLETED', progress = 100, storage_path = $1, updated_at = NOW() WHERE id = $2
      `,
      [storagePath, reportId],
    );

    await redisClient.publish(
      "report_updates",
      JSON.stringify({
        reportId,
        status: "COMPLETED",
        progress: 100,
      }),
    );

    return { storagePath };
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
