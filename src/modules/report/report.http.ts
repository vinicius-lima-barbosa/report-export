import { reportQueue } from "@/infra/queues/report-queue";
import { successResponse } from "@/shared/utils/response";
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
      const reportId = `report_${Date.now()}`;

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
        .status(201)
        .json(
          successResponse(
            { reportId, status: "PENDING" },
            "Report generation job created successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  },
};
