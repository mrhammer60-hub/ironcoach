import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import { redis } from "../../config/redis.config";
import {
  CACHE_RESPONSE_KEY,
  type CacheResponseOptions,
} from "../decorators/cache-response.decorator";
import type { JwtPayload } from "../decorators";

@Injectable()
export class CacheResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const options = this.reflector.get<CacheResponseOptions>(
      CACHE_RESPONSE_KEY,
      context.getHandler(),
    );

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    const orgId = user?.orgId || "global";
    const queryString = JSON.stringify(request.query || {});
    const cacheKey = `cache:${request.url}:${orgId}:${Buffer.from(queryString).toString("base64").slice(0, 32)}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return of(JSON.parse(cached));
      }
    } catch {
      // Redis unavailable — skip cache
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await redis.setex(cacheKey, options.ttl, JSON.stringify(data));
        } catch {
          // Redis unavailable — skip
        }
      }),
    );
  }
}
