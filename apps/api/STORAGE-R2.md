# Cloudflare R2 — anexos (comprovantes e imagens)

A API usa **R2 primeiro** (se configurado), depois Supabase Storage, depois grava no banco. R2 tem **10 GB grátis** e sem custo de saída.

## 1. Criar bucket no Cloudflare R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**.
2. Nome do bucket: por exemplo **`canteiro-attachments`**.
3. Crie o bucket.
4. No bucket, vá em **Settings** → **Public access** → **Allow Access** e anote a URL pública (ex: `https://pub-xxxxx.r2.dev`).

## 2. Chaves de API (R2)

1. No menu R2, clique em **Manage R2 API Tokens** (ou **Overview** → **R2 API Tokens**).
2. **Create API token** → permissão **Object Read & Write** no bucket que você criou.
3. Anote: **Access Key ID**, **Secret Access Key**.
4. Na Overview do R2, anote seu **Account ID** (ou está na URL do dashboard).

## 3. Variáveis no `.env` da API

No `apps/api/.env`:

```env
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=seu_access_key_id
R2_SECRET_ACCESS_KEY=seu_secret_access_key
R2_BUCKET_NAME=canteiro-attachments
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

- `R2_PUBLIC_URL` = URL pública do bucket (com **Allow Access** ativado), **sem** barra no final.

Reinicie a API. Novos anexos passam a ir para o R2 (até 10 GB grátis).
