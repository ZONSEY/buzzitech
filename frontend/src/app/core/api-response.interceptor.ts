import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiEnvelope<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

function isApiEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    'data' in body
  );
}

export function apiResponseInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    map((event) => {
      if (
        event.type === 4 && // HttpEventType.Response
        'body' in event &&
        isApiEnvelope(event.body)
      ) {
        return event.clone({ body: event.body.data });
      }
      return event;
    }),
  );
}
