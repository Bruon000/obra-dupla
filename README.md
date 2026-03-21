# Canteiro (Obra Dupla)

App para controle de obras entre sócios — **web** (Vite/React) + **API** (NestJS) + opcional **Android** (Capacitor).

## Usar no seu PC (recomendado para começar)

1. **Instalar:** [Node.js](https://nodejs.org/) (LTS), [pnpm](https://pnpm.io/), [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para Postgres local).

2. **Dependências:**
   ```bash
   pnpm install
   ```

3. **Banco + migrações + usuário de teste** (sobe o Postgres e configura tudo):
   ```bash
   pnpm setup:local
   ```

4. **Subir interface + API ao mesmo tempo:**
   ```bash
   pnpm dev:all
   ```

5. **Abrir:** [http://localhost:8080](http://localhost:8080)  
   **Login dev:** `dev@obradupla.local` / senha do ficheiro `apps/api/.env` (`DEV_USER_PASSWORD`, por defeito `123456`).

Em desenvolvimento o front aponta para a API em `http://<teu-host>:3005` (mesmo IP do browser), por isso funciona no telemóvel na mesma Wi‑Fi.

### Comandos úteis

| Comando | O quê |
|--------|--------|
| `pnpm dev:all` | Web (8080) + API (3005) |
| `pnpm dev` | Só o front |
| `pnpm dev:api` | Só a API |
| `pnpm setup:local` | Docker Postgres + `.env` + migrate + seed |
| `pnpm -C apps/api db:migrate` | Aplicar migrações (com `.env` já configurado) |
| `pnpm -C apps/api db:seed` | Recriar/atualizar user dev |

### Produção / Supabase / deploy

- **Site online (Netlify + Render):** [`docs/ONLINE-NETLIFY-RENDER.md`](docs/ONLINE-NETLIFY-RENDER.md) — checklist com `VITE_API_URL`, Render e migrações.  
- Variáveis e billing: [`docs/SAAS-ENV.md`](docs/SAAS-ENV.md)  
- Deploy geral / APK: [`docs/DEPLOY-CANTEIRO.md`](docs/DEPLOY-CANTEIRO.md)  
- Guia rápido local: [`docs/USO-LOCAL.md`](docs/USO-LOCAL.md)

### Segurança

- Não commits `apps/api/.env` nem `.env` na raiz (estão no `.gitignore`).
- Se alguma vez commitaste segredos, **roda as passwords/keys** no painel (DB, JWT, storage).
