import { Injectable, NestMiddleware } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { FastifyRequest, FastifyReply } from "fastify";

export interface TenantContext {
  organizationId: string | null;
  userId: string | null;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: FastifyRequest["raw"], _res: FastifyReply["raw"], next: () => void) {
    const user = (req as unknown as Record<string, unknown>).user as
      | { sub: string; orgId: string }
      | undefined;

    // Allow admin impersonation via header
    const headerOrgId = (req.headers as Record<string, string | undefined>)[
      "x-organization-id"
    ];

    const context: TenantContext = {
      organizationId: headerOrgId ?? user?.orgId ?? null,
      userId: user?.sub ?? null,
    };

    tenantStorage.run(context, next);
  }
}
