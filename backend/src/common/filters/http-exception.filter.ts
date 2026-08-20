import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();

    response.status(exception.getStatus()).json({
      success: false,
      statusCode: exception.getStatus(),
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.message,
    });
  }
}
