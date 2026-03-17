# Análise do projeto obra-dupla

Este documento descreve o que existe no backend, o que existe em cada frontend e o que está faltando ou desconectado.

---

## 1. O que o backend (API) já tem

### 1.1 Modelos no Prisma

| Modelo | Uso |
|--------|-----|
| **Company** | Multi-tenant; todas as entidades pertencem a uma company. |
| **User** | Usuários por company; criados via POST /users; usados em job-costs (createdBy, updatedBy, deletedBy). |
| **JobSite** | “Obra” no sentido da API; tem costEntries (JobCostEntry) e customFieldValues. **Não há controller** – não existe GET/POST jobsites. |
| **JobCostEntry** | Lançamento de custo: date, source (OBRA/LEGAL/LABOR), category, description, weekLabel, quantity, unitPrice, totalAmount, payer (BRUNO/ROBERTO/CAIXA/OUTRO), **supplier**, **invoiceNumber**, **paymentMethod**, **notes**, attachments (JobCostAttachment[]). |
| **JobCostAttachment** | Comprovante por lançamento: fileName, mimeType, storageType, **fileDataBase64**, fileUrl, thumbnailBase64. |
| **ActivityEvent** | Histórico/auditoria: eventType, entityType, entityId, payload, userId, createdAt. |
| **Client, Quote, CustomField, CustomFieldValue, Workflow, Template, SyncDevice, SyncConflict** | Existem no schema; **não há controllers** – nenhuma rota exposta. |

### 1.2 Rotas expostas na API

| Rota | Método | Função |
|------|--------|--------|
| `/job-costs` | GET | Lista por jobSiteId (filtros: source, payer, category). Retorna entries **com attachments**. |
| `/job-costs/summary` | GET | Resumo e acerto entre sócios (totals, bySource, byPayer, settlement). |
| `/job-costs` | POST | Criar lançamento (inclui notes, supplier, invoiceNumber, paymentMethod). |
| `/job-costs/:id` | PATCH | Atualizar lançamento. |
| `/job-costs/:id` | DELETE | Excluir (soft delete). |
| `/job-cost-attachments` | POST | Criar anexo (fileName, mimeType, storageType, fileDataBase64, fileUrl, thumbnailBase64). |
| `/job-cost-attachments/:id` | PATCH / DELETE | Atualizar ou remover anexo. |
| `/activity-feed` | GET | Listar eventos por entityType + entityId (ex.: histórico do lançamento). |
| `/users` | GET / POST | Listar usuários da company; criar usuário (email, password, name, role). |

**Não existe:** `/sync`, `/jobsites`, `/clients`, `/quotes`, `/custom-fields`, `/workflows`, `/templates`.

---

## 2. Frontend raiz (Vite em `src/`)

### 2.1 O que esse app faz hoje

- **Páginas:** Index (entrar), Dashboard (lista de obras), Obras (lista + busca), Nova obra (formulário), Detalhe da obra (abas: Resumo, Gastos, Legais, Mão de obra, Venda, Auditoria).
- **Dados:** Tudo em **mock** (`mock-data.ts` + `ConstructionsContext`). **Nenhuma chamada à API** (nem job-costs, nem attachments, nem activity-feed, nem users).
- **Conceitos:** “Obra” = Construction (id, title, address, status, etc.). “Gastos” = Expense, “Legais” = LegalCost, “Mão de obra” = LaborEntry. São estruturas locais, não equivalentes diretos a JobSite/JobCostEntry.

### 2.2 O que já existe na UI (com mock)

- Resumo financeiro e acerto entre sócios (calculations.ts).
- Criar/editar/excluir gastos, custos legais e mão de obra (drawers + listas com botões).
- Registrar venda (drawer) e marcar obra como vendida.
- Aba Auditoria (log local de criar/editar/excluir).
- Criar nova obra (contexto + rota /obras/nova).
- Campos **notes** nos formulários de gasto, legal e mão de obra (salvos no estado).
- Tipo **Expense** tem `receiptImageUrl` (uma URL de imagem), mas **não há upload** nem lista de anexos.

### 2.3 O que falta nesse app em relação ao backend e ao apps/web

| Recurso | Backend / apps/web | Frontend raiz |
|---------|--------------------|----------------|
| **Anexos / comprovantes** | API job-cost-attachments; apps/web: upload, lista por lançamento, abrir arquivo (base64/URL). | Só `receiptImageUrl` no tipo; **sem upload**, **sem lista de anexos** nos cards. |
| **Notas visíveis na lista** | apps/web: “Obs: {notes}” no card. | Notes só no formulário; **não aparecem** nos cards de Gastos/Legais/Mão de obra. |
| **Fornecedor / documento / forma de pagamento** | JobCostEntry: supplier, invoiceNumber, paymentMethod. apps/web: campos no form e no card. | **Não existem** no tipo Expense nem nos formulários/listas. |
| **Activity feed (histórico por entidade)** | GET /activity-feed; apps/web: “Ver histórico” no card. | Só “Auditoria” local; **não consome** o activity feed da API. |
| **Integração com a API** | job-costs, summary, attachments, activity-feed, users. | **Nenhuma**; tudo mock. |
| **JobSite vs Construction** | API usa jobSiteId; não há rota para listar/criar jobsites. | Obras são Construction no contexto; não há mapeamento para JobSite. |

---

## 3. Apps/web (Next.js / MUI)

- Consome **job-costs** (list, summary, create, update, delete) e **job-cost-attachments** (create, delete).
- Exibe **anexos** por lançamento (lista de arquivos, abrir em nova aba).
- Exibe **notes**, supplier, invoiceNumber no card.
- Tem **JobCostHistoryDialog** (activity feed por entry).
- Preparado para sync (Dexie + useSync), mas a API **não expõe** `/sync`.

---

## 4. Resumo dos gaps (frontend raiz)

1. **Anexos de notas/comprovantes** – Backend e apps/web têm anexos por lançamento; no app raiz falta upload e exibição de anexos nos gastos (e, se quiser paridade, em legais/mão de obra).
2. **Notas e dados extras visíveis** – Notes, fornecedor, número do documento e forma de pagamento existem no backend e no apps/web; no app raiz as notes estão só no form; supplier/invoiceNumber/paymentMethod nem existem no modelo.
3. **Uso da API** – O app raiz não chama a API; toda a riqueza (job-costs, attachments, activity-feed, summary) fica só no apps/web.
4. **Listagem de obras pela API** – Não existe GET /jobsites; para o app raiz “obras” virem da API seria preciso criar esse endpoint e mapear JobSite ↔ Construction.

---

## 5. Próximos passos sugeridos

- **No app raiz (sem mudar para API ainda):**  
  - Adicionar **anexos** nos gastos (tipo, formulário com upload, exibição nos cards).  
  - Mostrar **notes** (e, opcionalmente, supplier, documento, forma de pagamento) nos cards de Gastos, Legais e Mão de obra.  
- **Para unificar com a API:**  
  - Definir se “obra” do app raiz = JobSite (criar GET/POST jobsites e usar jobSiteId em todas as chamadas).  
  - Trocar mock de gastos/legais/mão de obra por chamadas a job-costs e job-cost-attachments.  
  - Conectar a aba “Auditoria” ou “Histórico” ao GET /activity-feed quando houver entityId (lançamento) da API.

Este documento pode ser atualizado conforme novos endpoints (sync, jobsites, etc.) forem implementados.
