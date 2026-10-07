import type { ApiResponse } from '@jrs/shared';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((resData) => {
        // If handler already prepared pagination meta or message
        if (
          resData &&
          typeof resData === 'object' &&
          'data' in resData &&
          ('meta' in resData || 'message' in resData)
        ) {
          return {
            success: true,
            statusCode,
            message: resData.message || 'Operation successful',
            data: resData.data,
            meta: resData.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Operation successful',
          data: resData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
