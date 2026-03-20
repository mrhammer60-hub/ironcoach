import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Redis
  REDIS_PASSWORD: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_GROWTH: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().url().default("http://localhost:3000/billing/success"),
  STRIPE_CANCEL_URL: z.string().url().default("http://localhost:3000/billing/cancel"),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY: z.string().min(1),
  R2_SECRET_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),
  R2_ENDPOINT: z.string().url().optional(),

  // Resend (email)
  RESEND_API_KEY: z.string().startsWith("re_"),
  EMAIL_FROM: z.string().default("IronCoach <noreply@ironcoach.com>"),

  // Expo Push
  EXPO_ACCESS_TOKEN: z.string().min(1),
  EAS_PROJECT_ID: z.string().optional(),
  EXPO_SLUG: z.string().default("ironcoach"),

  // Next.js
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),

  // URLs
  APP_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // BullMQ Dashboard
  BULL_BOARD_USERNAME: z.string().default("admin"),
  BULL_BOARD_PASSWORD: z.string().default("admin"),

  // Server
  PORT: z.coerce.number().default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function createEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = createEnv();
