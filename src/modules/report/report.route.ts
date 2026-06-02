import { validateBody } from "@/shared/middlewares/validate.middleware";
import { Router } from "express";
import { reportHttp } from "./report.http";
import { createReportSchema } from "./report.schema";

const router: Router = Router();

router.post("/", validateBody(createReportSchema), reportHttp.createReport);

export default router;
