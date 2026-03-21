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

/** Lê chaves simples do .env da API (sem multilinha). */
function readApiDotenv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[m[1]] = val;
  }
  return out;
}

/** Mesma regra que prisma.config.ts: DIRECT tem prioridade para CLI. */
function prismaCliDatabaseUrl(vars) {
  const direct = vars.DATABASE_URL_DIRECT?.trim();
  if (direct) return direct;
  return vars.DATABASE_URL?.trim() ?? "";
}

function maskDatabaseUrl(u) {
  if (!u) return u;
  return u.replace(/:([^:@/]+)@/, ":****@");
}

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

  const envVars = readApiDotenv();
  const effectiveDb = prismaCliDatabaseUrl(envVars);
  const usesLocalDockerDb =
    /localhost:5434|127\.0\.0\.1:5434/.test(effectiveDb) ||
    /localhost:5434|127\.0\.0\.1:5434/.test(envVars.DATABASE_URL ?? "");

  if (effectiveDb && !usesLocalDockerDb) {
    console.log(`
⚠️  O Prisma CLI (migrate) e o seed usam a URL efetiva abaixo — não o Postgres do Docker.
    ${maskDatabaseUrl(effectiveDb)}
    (${envVars.DATABASE_URL_DIRECT?.trim() ? "Porque DATABASE_URL_DIRECT está definido (prioridade no prisma.config)." : "Porque é o teu DATABASE_URL."})

    Se quiseres BD só no Docker: copia DATABASE_URL de apps/api/.env.example (porta 5434)
    e remove/comenta DATABASE_URL_DIRECT no .env. Depois: pnpm -C apps/api db:migrate && pnpm -C apps/api db:seed

    Se estás bem com Supabase na cloud, podes parar o container: docker compose down
`);
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
