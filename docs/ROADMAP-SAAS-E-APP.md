# Roadmap: App para sócios + SaaS para vender

Seu produto já está **multi-tenant**: cada `Company` é um “cliente” e todos os dados (obras, usuários, custos) são filtrados por `companyId`. Falta expor isso como app instalável e como SaaS vendável.

---

## Parte 1 — App para você e seu sócio usar junto

Objetivo: você e seu sócio usarem o sistema no dia a dia (celular/tablet/PC).

### 1.1 PWA (Progressive Web App) — recomendado primeiro

- O frontend já é web; basta torná-lo “instalável”.
- **O que fazer:**
  - Adicionar `manifest.json` (nome do app, ícones, tema).
  - Service worker para funcionar offline básico (opcional no início).
  - HTTPS em produção (obrigatório para PWA).
- **Resultado:** no celular, “Adicionar à tela inicial” / “Instalar app”; abre como app, sem barra do navegador.

### 1.2 Colocar no ar (hosting)

- **Frontend:** Vercel, Netlify ou Cloudflare Pages (grátis para começar).
- **API:** Railway, Render ou Fly.io (plano free/low cost).
- **Banco:** Supabase (já usa; pode manter ou migrar depois).
- **Domínio:** um domínio só (ex: `app.canteiro.com.br`) apontando para front + API.

### 1.3 Convite do sócio

- Hoje: um admin cria usuário (e-mail + senha) na tela de Usuários.
- Para “passar pro sócio”: basta criar o usuário dele na mesma Company e enviar o link do app + “sua senha é X” (ou “defina sua senha no primeiro acesso” se você implementar “redefinir senha”).

**Resumo Parte 1:** PWA + deploy (front + API) + domínio + criar usuário do sócio na mesma Company = **app pronto para você dois usarem**.

---

## Parte 2 — SaaS para vender para outros

Objetivo: outros clientes (duplas de sócios, escritórios) se cadastrarem, pagarem e usarem o sistema sozinhos.

### 2.1 Cadastro público (sign up) — **implementado**

- **Web:** rota `/cadastro` + `POST /auth/register` na API.
- **Fluxo:** nome da equipe, seu nome, e-mail, senha → cria `Company` (trial + limites) + primeiro usuário `ADMIN` → retorna o mesmo JSON do login.
- **Variáveis:** ver `docs/SAAS-ENV.md` (`PUBLIC_REGISTRATION_ENABLED`, `TRIAL_DAYS`, limites do plano free).

### 2.2 Planos e preço

- Definir ofertas, por exemplo:
  - **Grátis:** 1 obra, 2 usuários (ou só leitura).
  - **Mensal:** X obras, usuários ilimitados, R$ Y/mês.
  - **Anual:** mesmo que mensal, com desconto.
- No banco: tabela `Subscription` ou campos em `Company`: `planId`, `status` (active/canceled/trial), `currentPeriodEnd`, etc.

### 2.3 Pagamento (Stripe)

- Integrar **Stripe** (cartão, PIX, boleto):
  - Checkout Session para assinatura (mensal/anual).
  - Webhook: quando o pagamento é confirmado, atualizar `Company` (plano ativo, data de renovação).
- Antes do pagamento: pode ter **trial** (ex.: 14 dias) — ao criar Company no signup, marcar `status: 'trial'` e `trialEndsAt`.

### 2.4 Limites por plano

- Em cada ação relevante (criar obra, criar usuário), a API verifica:
  - Número de obras da Company ≤ limite do plano.
  - Número de usuários ≤ limite do plano.
- Se ultrapassar, retornar 403 com mensagem “Faça upgrade”.

### 2.5 Landing page + marketing

- Site público (ex: `canteiro.com.br`):
  - O que é o produto, para quem é, benefícios.
  - Preços, botão “Começar grátis” / “Assinar”.
  - Link para `/cadastro` e `/login`.

### 2.6 Área do cliente (opcional mas útil)

- Após login, para o admin da Company:
  - “Minha conta” / “Plano e cobrança”: ver plano atual, ver faturas, upgrade/cancelar.
  - Pode ser uma página no próprio app que chama a API (que por sua vez fala com Stripe).

---

## Ordem sugerida

| Fase | O que fazer | Objetivo |
|------|-------------|----------|
| **1** | PWA (manifest + ícones) | App instalável para você e o sócio |
| **2** | Deploy (front + API) + domínio | Usar em produção |
| **3** | Cadastro público (sign up) | Novos clientes se cadastrarem sozinhos |
| **4** | Trial (ex.: 14 dias) | Testar sem cartão |
| **5** | Stripe + planos + limites | Cobrar e limitar por plano |
| **6** | Landing page | Divulgar e captar leads |

---

## Checklist rápido

**App (você + sócio):**
- [ ] PWA: `manifest.json` + ícones
- [ ] Deploy do frontend (Vercel/Netlify)
- [ ] Deploy da API (Railway/Render)
- [ ] Domínio (ex: app.seudominio.com.br)
- [ ] Criar usuário do sócio na mesma Company e enviar link + senha

**SaaS (vender):**
- [ ] `POST /auth/register` (criar Company + User)
- [ ] Tela de cadastro no front (`/cadastro`)
- [ ] Tabela/campos de assinatura (plano, status, trialEndsAt)
- [ ] Stripe: produtos, preços, Checkout, webhook
- [ ] Limites por plano (obras, usuários) na API
- [ ] Landing page com preços e “Começar grátis”

---

## Observações técnicas

- **Auth:** manter JWT por Company; no signup, o token já vem com `companyId` do novo cliente.
- **Supabase:** no plano pago você pode ter mais conexões e recursos; para muitos clientes, vale monitorar uso e considerar pooler/connection_limit.
- **E-mail:** para “esqueci senha” e confirmação de e-mail, usar SendGrid, Resend ou Supabase Auth (se migrar login para Supabase Auth depois).

Se quiser, podemos começar por **uma** dessas partes (por exemplo: PWA + deploy, ou só o fluxo de cadastro público) e eu te guio passo a passo no código.
