import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthMiddleware } from "./auth.middleware";
import { PrismaService } from "../prisma/prisma.service";
import { StatementTimeoutMiddleware } from "../prisma/statement-timeout.middleware";
import { ActivityFeedModule } from "../activity-feed/activity-feed.module";

@Module({
  imports: [ActivityFeedModule],
  controllers: [AuthController],
  providers: [AuthService, AuthMiddleware, StatementTimeoutMiddleware, PrismaService],
  exports: [AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Define statement_timeout no início de cada request (evita timeout com pooler Supabase).
    consumer.apply(StatementTimeoutMiddleware).forRoutes("*");
    consumer
      .apply(AuthMiddleware)
      .exclude("auth", "auth/(.*)")
      .forRoutes("*");
  }
}
