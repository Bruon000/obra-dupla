# Variáveis de ambiente — base SaaS (Canteiro)

Use estes valores na API (`apps/api/.env`) ou no painel do host (Render/Railway/VPS).

## Supabase + Prisma Migrate (travou em `migrate deploy`?)

Se o comando parar depois de mostrar `pooler.supabase.com:6543`, é quase sempre o **transaction pooler**: migração precisa de conexão **direta**.

1. No Supabase: **Project Settings → Database → Connection string → URI**.
2. Escolha **Direct connection** (porta **5432**, host tipo `db.xxxxx.supabase.co`).
3. No `apps/api/.env` adicione (sem apagar o pooler que a API usa em runtime):

   ```env
   DATABASE_URL_DIRECT="postgresql://postgres.[...]:[SENHA]@db.xxxxx.supabase.co:5432/postgres"
   ```

4. Rode de novo: `cd apps/api && npx prisma migrate deploy`

O `prisma.config.ts` já usa `DATABASE_URL_DIRECT` para o CLI quando essa variável existir. A API Nest continua usando só `DATABASE_URL` (pooler) em `PrismaService`.

### Só via PowerShell (sem editar `.env` na mão)

O **Read-Host** do PowerShell costuma **não aceitar colagem**; use **área de transferência**:

```powershell
cd C:\Users\BruoN\obra-dupla
# 1) No Supabase: Connect → Direct → URI → copiar (com senha no lugar de [YOUR-PASSWORD])
# 2) No PowerShell:
.\scripts\set-supabase-direct-url.ps1 -Clipboard
```

Alternativas: `-Uri 'postgresql://...'` com **aspas simples**; ou uma linha no arquivo `apps\api\.supabase-direct-uri.txt` e rodar o script sem argumentos. Depois: `npx prisma migrate deploy` em `apps\api`.

## Cadastro público

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PUBLIC_REGISTRATION_ENABLED` | `true` | `false` desliga `POST /auth/register` (apenas convite/admin cria usuários). |
| `TRIAL_DAYS` | `14` | Dias de trial ao criar empresa pelo cadastro. |
| `PLAN_FREE_MAX_JOBSITES` | `5` | Máximo de obras na conta criada pelo cadastro. |
| `PLAN_FREE_MAX_USERS` | `5` | Máximo de usuários na conta criada pelo cadastro. |

Empresas **existentes** antes da migração recebem `maxJobSites` e `maxUsers` **999** (comportamento legado). O seed de desenvolvimento força `billingStatus=internal` para não bloquear login por trial.

## Billing (próximos passos)

| Variável | Descrição |
|----------|-----------|
| `STRIPE_SECRET_KEY` | Chave secreta Stripe (futuro). |
| `STRIPE_WEBHOOK_SECRET` | Validação de webhooks (futuro). |

Quando integrar Stripe: atualizar `billingStatus`, `stripeCustomerId`, `stripeSubscriptionId` e limites via webhook.

## Endpoints

- `POST /auth/register` — corpo: `{ companyName, adminName, email, password }`
- `GET /billing/summary` — requer JWT; retorna plano, trial, limites e uso.

## Status de billing (`Company.billingStatus`)

- `internal` — sem bloqueio (time interno / dev).
- `trialing` — trial ativo; após `trialEndsAt`, login bloqueado até upgrade.
- `active` — assinatura OK (ou uso interno pago).
- `past_due` / `canceled` — login bloqueado com mensagem orientando regularização.
