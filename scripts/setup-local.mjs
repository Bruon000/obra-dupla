/**
 * Prepara ambiente local: Postgres (Docker), .env da API, migrações, seed.
 * Uso (na raiz): node scripts/setup-local.mjs
 * Requer: Docker em execução.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "apps", "api");
const envPath = path.join(apiDir, ".env");
const examplePath = path.join(apiDir, ".env.example");

function run(cmd, opts = {}) {
  execSync(cmd, {
    cwd: opts.cwd ?? root,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
    shell: true,
  });
}

async function waitForPostgres() {
  for (let i = 0; i < 45; i++) {
    try {
      execSync("docker compose exec -T postgres pg_isready -U obra -d obra_dupla", {
        cwd: root,
        stdio: "pipe",
      });
      return;
    } catch {
      await delay(1000);
    }
  }
  throw new Error("Postgres não respondeu a tempo. Verifique: docker compose ps");
}

async function main() {
  if (!fs.existsSync(examplePath)) {
    throw new Error(`Falta ${examplePath}`);
  }
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("✓ Criado apps/api/.env a partir de .env.example\n");
  } else {
    console.log("• apps/api/.env já existe (não sobrescrevi)\n");
  }

  console.log("→ Subindo Postgres (docker compose)…\n");
  run("docker compose up -d");

  console.log("\n→ Aguardando banco ficar pronto…\n");
  await waitForPostgres();

  console.log("\n→ Rodando migrações Prisma…\n");
  run("npx prisma migrate deploy", { cwd: apiDir });

  console.log("\n→ Seed (usuário dev)…\n");
  run("npx ts-node src/seed-dev.ts", { cwd: apiDir });

  console.log(`
Pronto.
  • API:  pnpm dev:api   (ou pnpm dev:all com o front)
  • Web:  pnpm dev
  • Login: dev@obradupla.local / (senha em DEV_USER_PASSWORD do .env, default 123456)
`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
