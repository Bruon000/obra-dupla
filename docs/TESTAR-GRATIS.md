# Testar o Canteiro **sem pagar** (por agora)

O plano **grátis do Render** (~512 MB RAM) faz a API **reiniciar** por memória → o site na Netlify parece “sem ligação”. Para **ir testando o projeto com calma**, usa **local** ou **Supabase + local**.

---

## Opção 1 — Recomendada: tudo no teu PC (Docker + web + API)

**Custo:** 0 €. **Não depende** do Render nem de quota de memória na cloud.

1. [Node.js LTS](https://nodejs.org/), [pnpm](https://pnpm.io/), [Docker Desktop](https://www.docker.com/products/docker-desktop/) ligado.
2. Na **raiz** do repo:

```bash
pnpm install
pnpm setup:local    # Postgres em Docker (porta 5434), .env, migrações, user dev
pnpm dev:all        # site :8080 + API :3005
```

3. Abre **http://localhost:8080**  
4. Login: `dev@obradupla.local` / senha em `apps/api/.env` → `DEV_USER_PASSWORD` (default `123456`).

### Telemóvel na mesma Wi‑Fi

O `vite` já escuta em todas as interfaces (`host: "::"`). No telemóvel usa:

`http://<IP-do-teu-PC>:8080`

O front em dev aponta a API para `http://<mesmo-host>:3005` automaticamente — não precisas de `VITE_API_URL` para isto.

*Detalhes e armadilhas do `.env`:* [`docs/USO-LOCAL.md`](USO-LOCAL.md)

---

## Opção 2 — Supabase grátis + API e site no PC

Útil se quiseres **dados na cloud** mas **sem pagar** hosting da API.

1. Cria projeto no [Supabase](https://supabase.com) (free).
2. `apps/api/.env`: `DATABASE_URL` (pooler) + `DATABASE_URL_DIRECT` (5432) como em [`docs/SAAS-ENV.md`](SAAS-ENV.md).
3. Migrações: `pnpm -C apps/api db:migrate` **ou** SQL em [`docs/APLICAR-MIGRACAO-SUPABASE.md`](APLICAR-MIGRACAO-SUPABASE.md) se der P1001 no PC.
4. `pnpm -C apps/api db:seed` (opcional) e depois `pnpm dev:all`.

---

## Opção 3 — Demo “online” Netlify + Render **todos grátis**

Funciona para **mostrar** o projeto, mas:

- API no Render free pode **dormir** (primeiro pedido ~1 min) e **reiniciar por RAM**.
- Garante [`docs/ONLINE-NETLIFY-RENDER.md`](ONLINE-NETLIFY-RENDER.md): `VITE_API_URL`, sem `migrate` no build, etc.

**Netlify** no grátis costuma **não** ser o problema; quem costuma falhar é a **API** no Render.

---

## Quando quiseres estável em produção

- **Sobe o tipo de instância no Render** (mais RAM), **ou**
- Continua **só local** para desenvolvimento / testes.

---

## Resumo

| Objetivo              | O quê usar                    |
|-----------------------|-------------------------------|
| Testar à vontade       | **Opção 1** (`dev:all` local) |
| Dados na cloud grátis  | **Opção 2** (Supabase + local)|
| URL pública grátis     | **Opção 3** (instável)        |
| URL pública fiável     | Plano Render com mais RAM      |
