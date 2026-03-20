import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { RoleKey } from "@ironcoach/shared";
import { ROLES_KEY } from "../decorators";
import type { JwtPayload } from "../decorators";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleKey[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!user) throw new ForbiddenException("No user in request");

    if (!requiredRoles.includes(user.role as RoleKey)) {
      throw new ForbiddenException("Insufficient role permissions");
    }

    return true;
  }
}
