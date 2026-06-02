import { logger } from "@shared/utils/logger.js";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      { err, path: req.path, method: req.method },
      `[AppError] ${err.message}`,
    );
  } else {
    logger.error(
      { err, path: req.path, method: req.method },
      `[UnhandledError] ${err.message}`,
    );
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  res.status(500).json({ statusCode: 500, message: "Internal server error" });
}
