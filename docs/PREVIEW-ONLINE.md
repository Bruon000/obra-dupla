# Ver o Canteiro **online** (como vai ficar na internet)

Queres **só cloud**, sem correr nada no PC. Isto é possível, mas há uma distinção importante:

| Peça | Grátis costuma servir? | Notas |
|------|------------------------|--------|
| **Site (Netlify)** | Sim | O visual e o fluxo no browser são **iguais** aos de produção. |
| **Base (Supabase)** | Sim | Postgres na cloud, plano free. |
| **API (Render free)** | **Às vezes não** | ~512 MB RAM: **cold start** (~1 min a dormir) e **reinícios por memória** → erros de “não conecta”. |

Ou seja: **o site online mostra como vai estar a UI**; **a experiência completa** (login, listas sempre a carregar) no plano **grátis** do Render pode falhar sob uso real.

---

## O que fazer para a pré-visualização mais fiel (tudo online)

### 1. Front na Netlify (já é o “como vai estar”)

- Liga o mesmo repo / branch `main`.
- **Environment variables:** `VITE_API_URL` = URL HTTPS da API **sem barra no fim** (ex.: `https://obra-dupla.onrender.com`).
- Depois de mudar variáveis: **Deploy** → **Trigger deploy** → **Clear cache and deploy**.

Abre o URL Netlify no telemóvel e no PC — layout, tema, navegação = produção.

### 2. API no Render

Segue [`docs/ONLINE-NETLIFY-RENDER.md`](ONLINE-NETLIFY-RENDER.md):

- **Root Directory:** `apps/api`
- **Build:** `npm install && npm run build` (sem `migrate deploy` no build)
- **Start:** `npm start`
- **Env:** `DATABASE_URL`, `JWT_SECRET`, `HOST=0.0.0.0`, etc.

### 3. Comportamento no plano **grátis** (se não quiseres pagar ainda)

1. Na **primeira abertura** do dia, o serviço pode estar “dormindo”. Abre primeiro  
   `https://<tua-api>.onrender.com/health`  
   e espera **até ~1 minuto** até ver JSON `ok: true` (no nosso código também podes ver o `commit`).
2. Só depois abres o **site Netlify** e fazes login.
3. Evita **muitas abas** e **ações pesadas** ao mesmo tempo (muitas obras/gastos de uma vez), para **reduzir** reinícios por RAM.

Isto **não garante** 100% de estabilidade; só **melhora** a taxa de sucesso no free tier.

### 4. Quando quiseres “online como em produção” de verdade

No painel do Render, **muda o tipo de instância** para um plano **paga** com **mais RAM** (ex.: linha *Starter* — vê [preços atuais](https://render.com/pricing)).  
Mesmo URL da API → **não precisas** de alterar `VITE_API_URL` na Netlify (só redeploy se mudares o domínio).

---

## Checklist rápido

- [ ] `https://<api>/health` responde após cold start.
- [ ] Netlify com `VITE_API_URL` certo + deploy com cache limpo.
- [ ] Supabase com schema atualizado (ex. coluna `User.disabledAt` — [`APLICAR-MIGRACAO-SUPABASE.md`](APLICAR-MIGRACAO-SUPABASE.md)).

---

## Resumo

- **Só online + grátis:** usas Netlify + Render free + Supabase — **a interface** fica fiel; a **API** pode falhar por RAM ou sono.
- **Só online + estável:** manténs Netlify + Supabase e **pagas o mínimo** no Render para mais RAM na API.

Não existe truque mágico “100% grátis e sempre estável” para uma API Nest + Prisma com esta carga; o compromisso é **aceitar limites do free** ou **um pequeno upgrade só na API**.
