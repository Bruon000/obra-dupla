# Ajustes no Supabase (plano free)

## 1. Statement timeout (se der erro de timeout)

Se a API mostrar erro **"canceling statement due to statement timeout"**:

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) e entre no seu projeto.
2. No menu lateral, clique em **SQL Editor** → **New query**.
3. Cole e execute:

```sql
ALTER ROLE postgres SET statement_timeout = '60s';
```

4. Clique em **Run**. Reinicie a API.

---

## 2. Storage para comprovantes e imagens (recomendado)

A API aceita **dois** backends (um por vez): **Cloudflare R2** (10 GB grátis, preferencial) ou **Supabase Storage** (1 GB grátis). Se o R2 estiver configurado, ele é usado; senão, o Supabase. Ver **STORAGE-R2.md** para configurar R2.

Para **não estourar** os 500 MB do banco, os anexos (comprovantes, documentos) podem ir para o **Supabase Storage** (1 GB no plano free). A API já está preparada: basta configurar.

### Passo 1 — Criar o bucket

1. No Supabase: **Storage** (menu lateral) → **New bucket**.
2. Nome: **`attachments`**.
3. Marque **Public bucket** (para o app conseguir abrir o link do arquivo).
4. Crie o bucket.

### Passo 2 — Variáveis de ambiente na API

No `.env` da API (`apps/api/.env`), adicione (use os valores do seu projeto em **Project Settings** → **API**):

```env
SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

- **Project URL** → `SUPABASE_URL`
- **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`  
  (não use a chave `anon`; tem que ser a **service_role** para a API poder gravar no Storage.)

### Comportamento

- **Com** `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` definidos: novos anexos e documentos são enviados para o Storage; no banco fica só a URL. Você usa o limite de **1 GB de arquivos** em vez dos 500 MB do banco.
- **Sem** essas variáveis: tudo continua como antes (arquivo em base64 no banco). Anexos antigos que já estão no banco continuam funcionando.
