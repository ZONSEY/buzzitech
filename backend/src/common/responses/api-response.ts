export class ApiResponse {
  static success<T>(message: string, data: T, meta?: unknown) {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static created<T>(message: string, data: T) {
    return {
      success: true,
      message,
      data,
    };
  }
}
