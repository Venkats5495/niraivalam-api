import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If the response already has the correct shape, pass through
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
          return responseData;
        }

        // Check if response has meta (pagination) info
        if (responseData && typeof responseData === 'object' && 'data' in responseData && 'meta' in responseData) {
          return {
            success: true,
            data: responseData.data,
            meta: responseData.meta,
          };
        }

        return {
          success: true,
          data: responseData,
        };
      }),
    );
  }
}
