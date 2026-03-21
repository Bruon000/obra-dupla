import { Module, NestModule, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
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
    // `forRoutes("*")` em string NÃO aplica a todas as rotas no Nest 10 — usar RouteInfo.
    const all: { path: string; method: RequestMethod } = {
      path: "*",
      method: RequestMethod.ALL,
    };

    // Define statement_timeout no início de cada request (evita timeout com pooler Supabase).
    consumer.apply(StatementTimeoutMiddleware).forRoutes(all);

    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "/", method: RequestMethod.ALL },
        { path: "health", method: RequestMethod.ALL },
        { path: "health/(.*)", method: RequestMethod.ALL },
        { path: "auth", method: RequestMethod.ALL },
        { path: "auth/(.*)", method: RequestMethod.ALL },
      )
      .forRoutes(all);
  }
}
