# Resumo da refatoração – Obra Dupla

## Arquivos alterados

### Prioridade 1 – Lógica de negócio (acerto entre sócios)
- **`src/lib/calculations.ts`** – Corrigido `finalSettlement`: era `profitShare - balance` (invertido). Agora `profitShare + balance` → positivo = recebe, negativo = paga.
- **`apps/web/src/features/job-costs/JobCostsSummaryCards.tsx`** – UI de acerto corrigida: chips e subtítulos mostram "recebe" quando delta > 0 e "paga" quando delta < 0; adicionado bloco explícito: "Acerto entre sócios: X paga Y para Z".
- **`src/pages/ObraDetail.tsx`** – Bloco "Acerto entre sócios: [quem paga] paga [valor] para [quem recebe]" na aba Resumo (dados mock), alinhado à mesma regra.

### Prioridade 2 – Dados reais
- **`src/lib/mock-data.ts`** – Comentário no topo deixando explícito que são dados mock e que a integração com a API (localhost:3005) é pendente.
- **`apps/web/src/api/endpoints.ts`** – URL base da API alterada de `localhost:3000` para `localhost:3005`; adicionado export `users` para o endpoint de usuários.

### Prioridade 3 – Criação de usuários
- **`apps/api/src/users/users.module.ts`** – Novo módulo de usuários.
- **`apps/api/src/users/users.controller.ts`** – POST /users (criar) e GET /users (listar por empresa).
- **`apps/api/src/users/users.service.ts`** – Criação com hash de senha (scrypt) e listagem por `companyId`; conflito de e-mail retorna 409.
- **`apps/api/src/users/dto/create-user.dto.ts`** – DTO com email, password (mín. 6 caracteres), name, role opcional.
- **`apps/api/src/app.module.ts`** – Import de `UsersModule`.
- **`apps/api/src/main.ts`** – `ValidationPipe` global para validar DTOs (class-validator).

### Prioridade 4 – SaaS
- **`apps/api/src/main.ts`** – Comentário TODO no middleware de user fake: substituir por auth real (JWT/session); isolamento por `companyId` já está em uso nos serviços.

### Prioridade 5 – Tema construção civil
- **`src/index.css`** – Nova paleta: primary laranja/amarelo obra (28 87% 48%), background off-white (40 12% 97%), foreground grafite (220 15% 14%), secundários em cinza; dark mode ajustado; sombras e radius mais contidos.
- **`src/components/obra/StatCard.tsx`** – Variante primary usa `bg-primary/10` em vez de `emerald-light`.
- **`src/components/obra/SummaryHeader.tsx`** – Layout mais denso (gap/padding reduzidos), label "Lucro (após venda)" quando não há venda; prop `hasSale` para contexto.
- **`src/pages/ObraDetail.tsx`** – Passa `hasSale={!!sale}` para `SummaryHeader`.

---

## Bugs corrigidos

1. **Acerto entre sócios invertido**  
   - **Causa:** Em `calculations.ts`, `finalSettlement = profitShare - balance` fazia com que quem pagou a mais (balance > 0) ficasse com valor negativo e aparecesse "Paga".  
   - **Correção:** `finalSettlement = profitShare + balance` → quem pagou a mais recebe; quem pagou a menos paga.

2. **Resumo (apps/web) sem texto “recebe”/“paga”**  
   - Chips e cards mostravam só "saldo" ou "diferença".  
   - **Correção:** Texto explícito "Bruno recebe X" / "Roberto paga X" e bloco "Acerto entre sócios: Roberto paga X para Bruno" (ou o par correto).

3. **Impossibilidade de criar usuários**  
   - Não existia endpoint de usuários na API.  
   - **Correção:** Módulo Users com POST /users e GET /users, senha hasheada com scrypt, validação por DTO e listagem por `companyId`.

4. **API do apps/web apontando para porta errada**  
   - Default era 3000; a API roda em 3005.  
   - **Correção:** Default em `endpoints.ts` alterado para `http://localhost:3005`.

---

## Melhorias visuais aplicadas

- Tema “construção civil”: primary laranja/amarelo, fundos off-white/grafite, menos verde genérico.
- Resumo mais denso: menos padding no header e cards.
- "Lucro líquido" com contexto: "Lucro (após venda)" quando ainda não há venda.
- Bloco explícito de acerto na aba Resumo (frontend raiz) e em JobCostsSummaryCards (apps/web).

---

## Pendências (exigem backend ou produto futuros)

1. **Frontend raiz (Vite) 100% em mock**  
   - Dashboard, ObrasList, ObraDetail usam `CONSTRUCTIONS`, `EXPENSES`, etc.  
   - Integração com API (job-sites, job-costs, users) ainda não feita; comentário em `mock-data.ts` deixa isso explícito.

2. **Tela de criação de usuários no frontend**  
   - API: POST /users e GET /users prontos.  
   - Falta tela (ex.: em configurações ou gestão de membros) para listar e criar usuários da empresa.

3. **Auth real (SaaS)**  
   - Hoje `req.user` é injetado fixo no `main.ts`.  
   - Pendente: login (JWT ou session), registro de empresa, onboarding, recuperação de senha.

4. **Endpoints de job-sites**  
   - API não expõe GET /jobsites para listar obras; existe no Prisma e no sync.  
   - Para o frontend raiz listar “obras” da API, será necessário criar controller de job-sites (list/create por `companyId`).

5. **Billing / planos**  
   - Não implementado; arquitetura (companyId, Users) está preparada para evoluir para planos e billing.

---

## Regra de acerto (referência)

- **saldo = totalPago - parteIdeal**
- **saldo > 0** → recebe
- **saldo < 0** → paga `|saldo|`
- Exemplo: total 26.700; parte ideal 13.350 cada; Bruno 15.300 → recebe 1.950; Roberto 11.400 → paga 1.950.  
  Texto na UI: "Acerto entre sócios: Roberto paga 1.950 para Bruno".
