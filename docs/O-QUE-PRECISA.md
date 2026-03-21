# O que você precisa para colocar o app no ar

Checklist simples: domínio, onde hospedar, onde ficam os dados e como você e o sócio usam (navegador e APK).

---

## 1. Domínio — **opcional**

- **Sem domínio:** dá para usar os endereços grátis:
  - Site: `seu-projeto.vercel.app` (ou Netlify/Cloudflare)
  - API: `sua-api.railway.app` (ou Render)
- **Com domínio:** se quiser algo como `app.canteiro.com.br`, aí você paga registro (~R$ 40/ano) e aponta o domínio para o site e para a API.

**Resumo:** domínio **não é obrigatório** para começar.

---

## 2. O que mais precisa (lista)

| O quê | Onde / como | Custo |
|-------|-------------|--------|
| **Site (frontend)** | Vercel, Netlify ou Cloudflare Pages | Grátis (planos free) |
| **API (backend)** | Railway, Render ou Fly.io | Grátis ou ~US$ 5/mês |
| **Banco de dados** | Supabase (já usa) | Grátis (500 MB) |
| **Arquivos (comprovantes/imagens)** | Cloudflare R2 (recomendado) ou Supabase Storage | R2: 10 GB grátis; Supabase: 1 GB grátis |
| **Domínio** (opcional) | Registro.br, GoDaddy, etc. | ~R$ 40/ano |

Nada disso exige cartão para começar (só se for para plano pago depois).

---

## 3. Vai virar APK no Android? **Sim.**

- O projeto já está preparado com **Capacitor**.
- Você gera o **APK** no Android Studio e manda o arquivo pro sócio (WhatsApp, Drive, etc.); **não precisa** publicar na Play Store.
- Passo a passo: **`docs/ANDROID-APK-E-IPHONE.md`**.

---

## 4. Uso pelo navegador — **pode, é o mesmo app**

- **Você** pode usar **só pelo navegador** (Chrome, Safari, etc.) no PC ou no celular: é o mesmo site que você sobe na Vercel/Netlify.
- O **sócio** pode usar:
  - pelo **navegador** (mesmo link do site), ou
  - pelo **APK** no Android (instalando o arquivo que você enviar).
- Dados e login são os mesmos: navegador e APK falam com a **mesma API** e o **mesmo banco**.

Resumo: **navegador e APK = mesmo app, mesma conta, mesma obra.**
