import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Wraps every successful controller response in:
 * { success: true, message: 'OK', data: <original payload> }
 *
 * Applied globally in main.ts so every route is consistent.
 * The HttpExceptionFilter already shapes error responses with success: false,
 * so only successful (2xx) paths go through here.
 */
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'OK',
        data: data,
      })),
    );
  }
}