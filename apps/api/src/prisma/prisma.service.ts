import { INestApplication, Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "node:path";

// Sempre carregar o .env correto do app (apps/api),
// para não pegar o .env da raiz do monorepo acidentalmente.
const envPath = resolve(__dirname, "..", "..", ".env");
config({ path: envPath });

/**
 * Use connection_limit=5 (ou mais) no DATABASE_URL para evitar o aviso do pg
 * "client is already executing a query" quando várias requisições usam o Prisma em paralelo.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL ?? "",
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    // Aumenta o timeout de statements (Supabase costuma usar 8s por padrão).
    // Em pooler por transação (porta 6543) o SET pode não valer para todas as queries.
    // Se ainda der "statement timeout", no Supabase: SQL Editor → alter role postgres set statement_timeout = '60s';
    try {
      await this.$executeRawUnsafe("SET statement_timeout = '60s'");
    } catch {
      // Ignora se o servidor não permitir (ex.: role restrito).
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
