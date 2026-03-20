import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AUDIT_ENTITY_KEY } from "../decorators";
import type { JwtPayload } from "../decorators";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "token",
  "refreshToken",
  "accessToken",
  "stripeSecret",
  "apiKey",
  "secret",
];

function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;
  const sanitized = { ...body };
  for (const key of SENSITIVE_KEYS) {
    if (key in sanitized) sanitized[key] = "[REDACTED]";
  }
  return sanitized;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    if (!MUTATING_METHODS.has(method)) return next.handle();

    const entityType = this.reflector.get<string>(
      AUDIT_ENTITY_KEY,
      context.getHandler(),
    );
    if (!entityType) return next.handle();

    const user = request.user as JwtPayload | undefined;

    return next.handle().pipe(
      tap((responseData) => {
        const entityId =
          request.params?.id ??
          (responseData as Record<string, unknown>)?.id ??
          null;

        this.prisma.auditLog
          .create({
            data: {
              organizationId: user?.orgId ?? null,
              actorUserId: user?.sub ?? null,
              action: `${method} ${request.url}`,
              entityType,
              entityId: entityId ? String(entityId) : null,
              metadataJson: method === "DELETE" ? null : (sanitizeBody(request.body) ?? null),
              ipAddress: request.ip ?? null,
            },
          })
          .catch((err: Error) =>
            this.logger.error(`Failed to write audit log: ${err.message}`),
          );
      }),
    );
  }
}
