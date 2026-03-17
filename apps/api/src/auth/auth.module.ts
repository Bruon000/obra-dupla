import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthMiddleware } from "./auth.middleware";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthMiddleware, PrismaService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes("*");
  }
}
