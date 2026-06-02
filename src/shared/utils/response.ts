export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]> | string[];
}

export function successResponse<T>(
  data: T,
  message = "Operation completed successfully",
  meta?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    ...(meta && { meta }),
  };
}

export function errorResponse(
  message = "An error occurred",
  statusCode: number,
  errors?: Record<string, string[]> | string[],
): ApiErrorResponse {
  return {
    statusCode,
    message,
    ...(errors && { errors }),
  };
}
