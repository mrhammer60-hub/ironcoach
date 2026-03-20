export const jwtConfig = {
  accessSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
  accessExpiresIn: "15m",
  refreshExpiresIn: "7d",
  issuer: "ironcoach-api",
  audience: "ironcoach-client",
  algorithm: "HS256" as const,
};
