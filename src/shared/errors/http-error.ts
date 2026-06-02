import { AppError } from "./app-error";

export class NotFoundError extends AppError {
  constructor(resource = "Resource not found") {
    super(`${resource}`, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Data conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message = "Validation failed",
    errors: Record<string, string[]> = {},
  ) {
    super(message, 422);
    this.name = "ValidationError";
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
