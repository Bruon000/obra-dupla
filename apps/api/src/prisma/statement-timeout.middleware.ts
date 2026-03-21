import { Injectable, NestMiddleware } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/**
 * Define statement_timeout no início de cada request.
 * Com Supabase pooler (porta 6543) cada transação pode usar outra conexão,
 * então o SET no onModuleInit do Prisma não vale para todas as queries.
 * Este middleware garante que a conexão usada no request tenha 60s de timeout.
 */
@Injectable()
export class StatementTimeoutMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(_req: unknown, _res: unknown, next: () => void) {
    try {
      await this.prisma.$executeRawUnsafe("SET statement_timeout = '60s'");
    } catch {
      // Ignora se o servidor não permitir (ex.: role restrito).
    }
    next();
  }
}
