import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { jwtConfig } from "../config/jwt.config";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TokenService } from "./token.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: jwtConfig.accessSecret,
      signOptions: { expiresIn: jwtConfig.accessExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, TokenService, AuthService],
  exports: [JwtModule, PassportModule, TokenService],
})
export class AuthModule {}
