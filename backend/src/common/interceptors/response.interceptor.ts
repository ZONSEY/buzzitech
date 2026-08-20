import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface WrappedResponse<T> {
  success: true;
  timestamp: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  WrappedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
