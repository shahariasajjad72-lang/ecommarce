/**
 * TRANSFORM INTERCEPTOR
 *
 * Wraps all successful responses in a standard format.
 * This ensures your API always returns consistent responses.
 *
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   message: "Success",
 *   data: { ...  your data ...  },
 *   timestamp: "2024-01-20T10:30:00.000Z"
 * }
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: data?.message || 'Success',
        data: data?.data !== undefined ? data.data : data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
