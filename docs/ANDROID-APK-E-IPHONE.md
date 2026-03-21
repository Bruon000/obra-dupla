# APK para Android (sem Play Store) e uso no iPhone

## Android — gerar o APK e passar pro sócio

O app está configurado com **Capacitor**: o mesmo frontend vira um app Android instalável. O APK não precisa ir para a Play Store; você gera, envia (WhatsApp, Google Drive, etc.) e o sócio instala.

### Pré-requisito

- **Android Studio** instalado (para gerar o APK na sua máquina).  
  Download: [developer.android.com/studio](https://developer.android.com/studio)

### 1. API no ar (importante)

O app no celular precisa da URL da API **gravada no build** (`VITE_API_URL`). Em **produção** o app **não** adivinha o IP do PC (isso evita o “localhost = celular”).

- **Opção A — Mesma rede (Wi‑Fi / teste local):**  
  Copie `.env.android.lan.example` → `.env.android.lan`, coloque o IP do PC (`ipconfig`), ex.:
  ```env
  VITE_API_URL=http://192.168.1.10:3005
  ```
  Depois rode `npm run build:android:lan` e gere o APK no Android Studio. Só funciona na mesma rede da API.

- **Opção B — API na internet (recomendado):**  
  Crie `.env.production` com a URL HTTPS da API (Render, Railway, etc.):
  ```env
  VITE_API_URL=https://sua-api.onrender.com
  ```
  Rode `npm run build:android:prod` e gere o APK. Funciona de qualquer lugar.

Guia completo de deploy: **`docs/DEPLOY-CANTEIRO.md`**.

### 2. Gerar o build e o APK

No terminal, na pasta do projeto:

```bash
# 1. Build do site + copiar para o projeto Android (use build:android:prod ou build:android:lan)
npm run build:android:prod

# 2. Abrir o projeto Android no Android Studio
npm run cap:open:android
```

No **Android Studio**:

1. Espere o Gradle terminar de sincronizar (barra de progresso embaixo).
2. Menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
3. Quando terminar, clique em **locate** no aviso que aparecer, ou vá em:
   - `android/app/build/outputs/apk/debug/app-debug.apk`

Esse arquivo **app-debug.apk** é o app. Manda pro seu sócio por WhatsApp, Drive, e-mail, etc.

### 3. Instalar o APK no Android (sócio)

No celular Android:

1. Baixar o arquivo **app-debug.apk** (link que você enviou).
2. Abrir o arquivo e permitir “Instalar de fontes desconhecidas” se o sistema pedir (Configurações → Segurança).
3. Confirmar a instalação. O ícone **Canteiro** aparece na gaveta de apps.

### 4. Atualizar o app depois

Sempre que mudar o frontend ou a URL da API:

1. Ajustar o `.env` (ex: `VITE_API_URL=...`) se precisar.
2. Rodar de novo: `npm run build:android:prod` (ou `build:android:lan`).
3. No Android Studio: **Build** → **Build APK(s)**.
4. Enviar o novo **app-debug.apk** pro sócio; ele desinstala o antigo e instala o novo (ou instala por cima).

---

## iPhone — usar pelo navegador

No iPhone não é necessário criar app na App Store. Basta usar pelo **Safari**:

1. Abra o **Safari** e acesse o endereço do seu app (ex: `https://app.canteiro.com.br` ou o link da Vercel/Netlify onde o front estiver hospedado).
2. Faça login e use normalmente.
3. (Opcional) Toque no botão **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**. Assim aparece um ícone na home como se fosse um app; ao tocar, abre o site em tela cheia.

Se a API e o site estiverem na internet, você e seu sócio podem usar no iPhone de qualquer lugar, só entrando no mesmo link.

---

## Resumo

| Quem        | Como usar |
|------------|-----------|
| **Você (Android)**  | Instalar o mesmo APK ou acessar pelo navegador. |
| **Sócio (Android)** | Você envia o **app-debug.apk**; ele instala (sem Play Store). |
| **Você (iPhone)**   | Navegador (Safari) no link do app; opcional: “Adicionar à Tela de Início”. |
| **Sócio (iPhone)**  | Mesmo: navegador no link do app. |

**Importante:** Para o APK e para o iPhone funcionarem fora da sua rede, a **API precisa estar publicada na internet** (Railway, Render, etc.) e o **frontend** também (Vercel, Netlify). Configure `VITE_API_URL` em `.env.production` antes do `npm run build:android:prod` e use o mesmo domínio da API no site.
