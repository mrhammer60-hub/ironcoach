import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ success: boolean; data: T; meta: { serverTime: string } }> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          serverTime: new Date().toISOString(),
        },
      })),
    );
  }
}
