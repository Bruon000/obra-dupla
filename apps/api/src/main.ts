import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import * as v8 from "node:v8";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./prisma/prisma-exception.filter";

config({ path: resolve(process.cwd(), ".env") });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Support-Company-Id",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
      "bypass-tunnel-reminder",
    ],
  });

  // Render free ~512MB RAM: corpo JSON grande + serialização = OOM. Limite redefinível por env.
  const bodyLimit = process.env.JSON_BODY_LIMIT ?? "6mb";
  app.useBodyParser("json", { limit: bodyLimit });
  app.useBodyParser("urlencoded", { extended: true, limit: bodyLimit });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3005);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  const heapMb = Math.round(v8.getHeapStatistics().heap_size_limit / 1024 / 1024);
  console.log(
    `[heap] heap_size_limit_mb=${heapMb} (esperado ~320 no Render; se ~256, o Start deve ser "npm start" em apps/api)`,
  );
  console.log(`API rodando em http://localhost:${port}`);
  if (host === "0.0.0.0") {
    console.log(`API acessivel na rede local na porta ${port} (use o IP da maquina).`);
  }
}

bootstrap();
