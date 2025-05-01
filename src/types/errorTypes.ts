export class ApiError extends Error {
  constructor(public message: string, public code: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
