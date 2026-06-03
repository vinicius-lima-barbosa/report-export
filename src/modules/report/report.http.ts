import { db } from "@/config/database";
import { supabase } from "@/config/supabase";
import { reportQueue } from "@/infra/queues/report.queue";
import { errorResponse, successResponse } from "@/shared/utils/response";
import { NextFunction, Request, Response } from "express";
import { CreateReportDto } from "./report.schema";

export const reportHttp = {
  async createReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = req.body as CreateReportDto;
      // Fake IDs for demonstration purposes
      const fakeUserId = "user_abc123";

      const query = `
        INSERT INTO reports (user_id, status, progress)
        VALUES ($1, 'PENDING', 0)
        RETURNING id, status
      `;

      const dbResult = await db.query(query, [fakeUserId]);
      const createdReport = dbResult.rows[0];

      const reportId = createdReport.id;

      await reportQueue.add("generate-excel", {
        reportId,
        userId: fakeUserId,
        filters: {
          startDate: body.startDate,
          endDate: body.endDate,
          category: body.category,
        },
      });

      res
        .status(202)
        .json(
          successResponse(
            { reportId, status: createdReport.status },
            "Report generation job created successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  },

  async downloadReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const reportId = req.params.id;
      const fakeUserId = "user_abc123";

      const query = `SELECT * FROM reports WHERE id = $1 AND user_id = $2`;
      const dbResult = await db.query(query, [reportId, fakeUserId]);

      if (dbResult.rows.length === 0) {
        res
          .status(404)
          .json(errorResponse("Report not found or access denied", 404));
      }

      const report = dbResult.rows[0];

      const { data, error } = await supabase.storage
        .from("reports")
        .createSignedUrl(report.storage_path, 60);

      if (error) {
        res
          .status(500)
          .json(errorResponse("Failed to generate download URL", 500));
      }

      res
        .status(200)
        .json(successResponse(data!.signedUrl, "Report download endpoint"));
    } catch (error) {
      next(error);
    }
  },
};
