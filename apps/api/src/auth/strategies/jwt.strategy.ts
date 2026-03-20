import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConfig } from "../../config/jwt.config";
import type { JwtPayload } from "../../common/decorators";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  validate(payload: { sub: string; orgId: string; role: string; email: string }): JwtPayload {
    return {
      sub: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
      email: payload.email,
    };
  }
}
