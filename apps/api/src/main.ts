import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
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

  // Permite payloads JSON um pouco maiores (ex.: anexos base64)
  app.useBodyParser("json", { limit: "15mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "15mb" });

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
  console.log(`API rodando em http://localhost:${port}`);
  if (host === "0.0.0.0") {
    console.log(`API acessivel na rede local na porta ${port} (use o IP da maquina).`);
  }
}

bootstrap();
