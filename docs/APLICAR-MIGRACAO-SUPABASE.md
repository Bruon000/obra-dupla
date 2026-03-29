# Aplicar migração em produção (Supabase)

## Referência do projeto (Obra Dupla)

| | |
|--|--|
| **Project ID** | `aizrqqdgzzforgvxzybe` |
| **URL do projeto** | `https://aizrqqdgzzforgvxzybe.supabase.co` |
| **Host Direct (Prisma / porta 5432)** | `db.aizrqqdgzzforgvxzybe.supabase.co` |

No `apps/api/.env`, `DATABASE_URL_DIRECT` deve usar **este** host (`db.<Project ID>.supabase.co`); a `DATABASE_URL` do pooler (6543) usa o mesmo `postgres.<Project ID>` no user.

---

Se `npx prisma migrate deploy` no teu PC der **P1001** ou não puderes usar o terminal, aplica **no painel da Supabase**.

## 1. Coluna `User.disabledAt` (obrigatório se a API reclama desta coluna)

1. Abre o projeto correto no Supabase (o **Project ID** em **Settings → General** tem de bater com o host `db.<id>.supabase.co` da tua `DATABASE_URL`).
2. Vai a **SQL** → **New query**.
3. Cola e executa **só isto**:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);
```

4. Confirma em **Table Editor** → **User** → coluna **`disabledAt`**.

### Sincronizar o histórico do Prisma (recomendado)

No teu PC, com `apps/api/.env` a apontar para a **mesma** base:

```bash
cd apps/api
npx prisma migrate resolve --applied 20260322120000_user_disabled_at
```

Assim o Prisma sabe que essa migração já foi aplicada (evita duplicar o `ALTER` no próximo `migrate deploy`).

---

## 2. Restantes migrações pendentes

O ideal é correr no PC (rede que acede ao Postgres):

```bash
cd apps/api
# Opcional: no .env define DATABASE_URL_DIRECT (porta 5432) — vê prisma.config.ts
npx prisma migrate deploy
```

Se só usares SQL manual para várias alterações, vai aplicando os ficheiros em `apps/api/prisma/migrations/*/migration.sql` por ordem de nome e depois `prisma migrate resolve --applied <nome_da_pasta>` para cada uma.

---

## 3. Erros comuns

| Erro | O que fazer |
|------|-------------|
| **P1001** no PC | Projeto pausado? **Database** → resume. **Network restrictions** desativadas ou o teu IP permitido. Confirma password na connection string. Acrescenta `?sslmode=require` ao URI se faltar. Muitas redes **bloqueiam a porta 5432** — testa **hotspot** ou outra rede. |
| **Host errado** | O host tem de ser `db.<Project ID>.supabase.co` com o **mesmo** ID que em **Settings → General** (um carácter errado → P1001). Copia o URI em **Settings → Database**, não reescrevas à mão. |
| **Coluna já existe** | A migração já correu; usa só `prisma migrate resolve --applied ...` ou ignora. |

---

## 4. `migrate resolve` sem ligação do PC (SQL no Supabase)

Se **não** conseguires `npx prisma migrate resolve` (P1001), mas já aplicaste o `ALTER TABLE` manualmente, podes registar a migração na tabela `_prisma_migrations` **no SQL Editor** do Supabase (liga sempre por HTTPS, não precisa da porta 5432 no teu PC):

```sql
INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  '17ce7dfe9af2accca8ff142d021367045b648000b0ec4ba4c4f13c9ef4ab273c',
  NOW(),
  '20260322120000_user_disabled_at',
  NULL,
  NULL,
  NOW(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations" m
  WHERE m."migration_name" = '20260322120000_user_disabled_at'
);
```

O **checksum** corresponde ao ficheiro `apps/api/prisma/migrations/20260322120000_user_disabled_at/migration.sql` do repositório (SHA-256 do conteúdo). Se alterares esse ficheiro no futuro, o checksum deixa de bater.
