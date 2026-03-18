import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma v7: quando a URL do datasource não fica mais no `schema.prisma`,
// a conexão precisa ser movida para este arquivo de configuração.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});

