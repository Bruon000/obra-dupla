# Deixar o Canteiro 100% online (Netlify + Render)

Guia fechado para o stack **front na Netlify** + **API no Render** + **Postgres (Supabase)**.

## URLs de exemplo (ajusta se as tuas forem outras)

| O quê | Exemplo |
|-------|---------|
| Site (Netlify) | `https://obraprime.netlify.app` |
| API (Render) | `https://obra-dupla.onrender.com` |

---

## A) Render — API (`apps/api`)

1. **Web Service** → repo `Bruon000/obra-dupla`, branch `main`.
2. **Root Directory:** `apps/api`
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm start`
5. **Environment → Environment Variables** (obrigatório):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | String do Supabase (**Session mode / pooler**, porta **6543**). |
| `JWT_SECRET` | String longa e aleatória (nunca commits; gera uma nova para produção). |
| `HOST` | `0.0.0.0` |

**Recomendado** (migrações pelo PC, como em `docs/SAAS-ENV.md`):

| Variável | Valor |
|----------|--------|
| `DATABASE_URL_DIRECT` | URI **Direct** do Supabase (porta **5432**, host `db.xxx.supabase.co`). Só para `prisma migrate` no teu PC apontar ao mesmo projeto. |

**Opcional** (anexos em cloud): `R2_*` ou `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — vê `apps/api/STORAGE-R2.md`.

6. **Deploy.** Anota a URL HTTPS da API (**sem** `/` no fim).

### Migrações na base de produção

No teu PC (com `DATABASE_URL_DIRECT` no `apps/api/.env` para o **mesmo** Supabase da API):

```bash
cd apps/api
npx prisma migrate deploy
```

---

## B) Netlify — site (raiz do repo)

1. **Import from Git** → mesmo repositório, branch `main`.
2. **Base directory:** vazio (raiz: onde está `vite.config.ts` e `netlify.toml`).
3. O ficheiro `netlify.toml` já define:
   - build: `npm run build`
   - publish: `dist`
   - redirect SPA: `/*` → `/index.html`

4. **Site configuration → Environment variables** — **obrigatório**:

| Key | Value (exemplo) |
|-----|------------------|
| `VITE_API_URL` | `https://obra-dupla.onrender.com` |

**Sem esta variável**, o build não embute a URL da API e o login falha (ou tenta `localhost`).

5. **Deploys → Trigger deploy → Clear cache and deploy site** (sempre que mudares `VITE_API_URL` ou variáveis de build).

6. **Node:** o projeto fixa Node 20 (`.nvmrc` + `netlify.toml`). Se algo falhar no build, em Netlify confirma **Environment → NODE_VERSION** = `20`.

### Não precisas de “Add database” na Netlify

O Postgres é o **Supabase** (ou outro). O site Netlify é só estático.

---

## C) Checklist final

- [ ] Render: API **live**, logs sem erro ao arrancar.
- [ ] Supabase: `migrate deploy` já corrido na BD que a API usa.
- [ ] Netlify: `VITE_API_URL` = URL HTTPS do Render (sem `/` final).
- [ ] Netlify: deploy feito **depois** de definir a variável (de preferência com clear cache).
- [ ] Browser: abre o site Netlify → **Login** ou **Cadastro** → lista de obras carrega.

### Plano grátis Render

O primeiro pedido após inatividade pode demorar **~1 min** (cold start). Normal.

**Teste rápido no browser:** abre `https://obra-dupla.onrender.com/` ou `/health` — deve aparecer JSON `{"ok":true,...}`. Se não abrir, o problema é o serviço no Render (sleep, crash, URL errada), não a Netlify.

### CORS

A API já usa `origin: true` no Nest; o front em `https://*.netlify.app` consegue chamar a API.

### Erro 500 em `/jobsites` ou `/users`

1. No browser, **F12 → Network** → **Response**. A API pode devolver `prismaCode` (ex. **P2022** = coluna em falta → `prisma migrate deploy` na BD de produção) ou `code: "DB_INIT"` (ligação PostgreSQL / `DATABASE_URL`).
2. **Logs no Render:** Dashboard do serviço → **Logs** — a linha `HTTP ERROR` mostra a mensagem e stack completas.
3. **Debug temporário:** no Render, variável **`EXPOSE_API_ERRORS=true`** — a resposta JSON passa a incluir `message`/`detail`/`stack` do erro real. **Desliga depois** de corrigir.

---

## D) APK / build local com API online

Na raiz do projeto:

```bash
# .env.production com VITE_API_URL=https://obra-dupla.onrender.com
pnpm run build:android:prod
```

Ou copia `.env.production.example` → `.env.production` e edita a URL.
