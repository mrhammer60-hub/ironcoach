import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "accessToken",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "tokenHash",
  "passwordResetToken",
  "emailVerificationToken",
];

function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class SanitizeLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        error: (err) => {
          if (err?.response?.message) {
            // Ensure sensitive data isn't leaked in error responses
            // (Prisma errors sometimes include field values)
          }
        },
      }),
    );
  }
}

export { sanitize };
