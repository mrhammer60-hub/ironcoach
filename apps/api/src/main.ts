import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "@fastify/helmet";
import fastifyRawBody from "fastify-raw-body";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Raw body for Stripe webhooks
  await app.register(fastifyRawBody as any, {
    field: "rawBody",
    global: false,
    runFirst: true,
    routes: ["api/v1/billing/webhook"],
  });

  // Security headers
  await app.register(helmet as any, {
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  });

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // CORS
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("IronCoach API")
    .setDescription("Multi-tenant fitness coaching platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  // Start
  const port = process.env.PORT || 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
