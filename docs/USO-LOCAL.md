# Uso local (Canteiro)

## Pré-requisitos

- Node.js LTS + **pnpm**
- **Docker Desktop** a correr (para `docker compose`)

## Fluxo completo

```bash
pnpm install
pnpm setup:local    # cria apps/api/.env, sobe Postgres, migrate deploy, seed
pnpm dev:all        # web :8080 + API :3005
```

Abre `http://localhost:8080` e entra com:

- **Email:** `dev@obradupla.local`
- **Password:** valor de `DEV_USER_PASSWORD` em `apps/api/.env` (default `123456`)

## Postgres local

O `docker-compose.yml` na raiz expõe o Postgres na porta **5434** do host (evita conflito com instalações na 5432).

Parar / apagar dados:

```bash
docker compose down          # parar
docker compose down -v       # parar e apagar volume (BD limpa)
```

## Já uso Supabase em vez de Docker?

1. Copia `apps/api/.env.example` para `apps/api/.env`.
2. Coloca o teu `DATABASE_URL` (pooler) e, para migrações, `DATABASE_URL_DIRECT` (conexão direta 5432) — vê `docs/SAAS-ENV.md`.
3. `pnpm -C apps/api db:migrate`
4. `pnpm -C apps/api db:seed`
5. `pnpm dev:all`

## APK / rede local

Vê `docs/ANDROID-APK-E-IPHONE.md` e `.env.android.lan.example` na raiz.
