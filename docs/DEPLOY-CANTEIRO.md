# Deploy Canteiro — web em qualquer lugar + APK

## 1. O que você precisa no ar

| Peça | Função |
|------|--------|
| **Banco** | Já pode ser o Supabase (Postgres) que você usa. |
| **API** (Nest) | Um servidor Node com `apps/api` (ex.: Render). |
| **Front** (Vite) | Site estático (ex.: Vercel / Cloudflare Pages). |
| **R2** (opcional) | Anexos; mesmas variáveis `R2_*` da API. |

O **APK** é o mesmo front embutido; na hora do build você define **`VITE_API_URL`** = URL **HTTPS** da API pública (igual ao site).

---

## 2. API no Render (exemplo)

**Depois do primeiro setup:** atualizar o deploy pelo PC com **Git** (`git push`) ou **Render CLI** — ver **`docs/RENDER-POWERSHELL.md`**.

1. **New → Web Service**, conecte o repositório Git (ou faça deploy manual).
2. **Root directory:** `apps/api`
3. **Build command:**
   ```bash
   npm install && npm run build
   ```
   *(Compila TypeScript → `dist/` para não estourar RAM no Render com `ts-node`.)*
4. **Start command:**
   ```bash
   npm start
   ```
5. **Environment** (copie do seu `apps/api/.env`):
   - `DATABASE_URL` — connection string **pooler** Supabase (`:6543`) com `connection_limit` baixo, como já usa.
   - `DATABASE_URL_DIRECT` — URI **Direct** `:5432` só se for rodar migrações pelo mesmo projeto (no build acima já usa; mantenha igual ao local).
   - `JWT_SECRET` — string longa aleatória (obrigatório em produção).
   - `R2_*`, `SUPABASE_*` se usar storage legado, etc.
   - `PORT` — deixe vazio; o Render define `PORT` (o `main.ts` já usa `process.env.PORT`).
   - `HOST` — opcional; em PaaS costuma ser `0.0.0.0` (já é o padrão no código).

6. Anote a URL pública, ex.: `https://canteiro-api-xxxx.onrender.com`

**Cold start:** plano grátis do Render “dorme”; primeiro acesso pode demorar ~1 min.

---

## 3. Front no Vercel (exemplo)

1. **New Project** → importe o repo.
2. **Root Directory:** `.` (raiz do monorepo com `vite.config.ts`).
3. **Framework:** Vite  
4. **Build command:** `npm run build`  
5. **Output directory:** `dist`
6. **Environment variables:**
   - `VITE_API_URL` = `https://sua-api.onrender.com` (sem `/` no final)

7. Deploy. O site passa a funcionar “de qualquer lugar” com a API pública.

---

## 4. APK apontando para a API pública

Na **raiz** do projeto (Windows):

```powershell
# 1) Crie .env.production com a URL real da API
Copy-Item .env.production.example .env.production
# Edite .env.production → VITE_API_URL=https://sua-api.onrender.com

# 2) Build + sync Capacitor
npm run build:android:prod

# 3) Gerar APK (Android Studio ou Gradle)
cd android
.\gradlew.bat assembleDebug
```

O APK em `android/app/build/outputs/apk/debug/` usará a API definida no passo 1.

Sempre que **mudar** a URL da API, refaça `npm run build:android:prod` e um novo assemble.

---

## 5. APK só na rede local (PC + celular mesmo Wi‑Fi)

1. API no PC: `cd apps\api` → `npm run dev` (já ouve `0.0.0.0:3005`).
2. Copie `.env.android.lan.example` → `.env.android.lan` e coloque o IP do PC (`ipconfig`).
3. `npm run build:android:lan` → depois `gradlew assembleDebug`.

Firewall do Windows deve liberar entrada na porta **3005** (você já fez isso antes).

---

## 6. Checklist rápido

- [ ] `JWT_SECRET` forte na API em produção  
- [ ] CORS na API: `origin: true` já aceita qualquer origem; para restringir depois, fixe o domínio do Vercel.  
- [ ] `VITE_API_URL` **HTTPS** no front e no build do APK (HTTP em APK pode precisar de `network_security_config` já existente só para dev LAN).  
- [ ] Migrações aplicadas no mesmo banco que a API de produção usa.

---

## 7. `render.yaml` (opcional)

Se quiser definir o serviço como código, crie/edit `render.yaml` no repo conforme a documentação do Render; os comandos são os da seção 2.
