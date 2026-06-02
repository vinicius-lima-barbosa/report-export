import type { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ValidationError } from "../errors/http-error";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach((e) => {
          const key = e.path.join(".") || "body";
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });

        console.log(errors);
        next(new ValidationError("Validation failed", errors));
      } else {
        next(err);
      }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as Record<string, string>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach((e) => {
          const key = e.path.join(".") || "query";
          if (!errors[key]) errors[key] = [];
          errors[key].push(e.message);
        });
        next(new ValidationError("Invalid query parameters", errors));
      } else {
        next(err);
      }
    }
  };
}
