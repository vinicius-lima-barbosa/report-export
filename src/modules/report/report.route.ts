import { validateBody } from "@/shared/middlewares/validate.middleware";
import { Router } from "express";
import { reportHttp } from "./report.http";
import { createReportSchema } from "./report.schema";

const router: Router = Router();

router.get("/", reportHttp.getReports);
router.post("/", validateBody(createReportSchema), reportHttp.createReport);
router.post("/:id/download", reportHttp.downloadReport);

export default router;
