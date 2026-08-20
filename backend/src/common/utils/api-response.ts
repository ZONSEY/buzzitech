export class ApiResponse {
  static success<T>(message: string, data: T, meta?: Record<string, unknown>) {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }
}
