import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * O pooler do Supabase (porta 6543) costuma TRAVAR `prisma migrate` (locks / DDL).
 * Use no `.env`:
 * - `DATABASE_URL` — pooler (6543) para a API em runtime
 * - `DATABASE_URL_DIRECT` — conexão **Direct** do painel (host `db.<ref>.supabase.co`, porta **5432**)
 *
 * Comandos Prisma (migrate, db push, studio) passam a usar `DATABASE_URL_DIRECT` quando existir.
 */
const direct = process.env.DATABASE_URL_DIRECT?.trim();
const datasourceUrl = direct && direct.length > 0 ? direct : env("DATABASE_URL");

// Prisma v7: URL do datasource fica aqui, não no `schema.prisma`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});

