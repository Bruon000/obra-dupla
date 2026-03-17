# Login e preparação SaaS

## O que foi implementado

### API (NestJS)
- **POST /auth/login** – Body: `{ "email": "...", "password": "..." }`. Retorna `{ access_token, user }`. JWT válido por 7 dias.
- **Middleware de auth** – Todas as rotas exceto `/auth/*` exigem cabeçalho `Authorization: Bearer <token>`. Sem token ou token inválido → 401.
- **JWT** – Assinado com HMAC-SHA256. Configure `JWT_SECRET` no `.env` da API em produção.

### Frontend (Vite)
- **Página de login** – Rota `/login` (e-mail e senha). Após sucesso, redireciona para a página que o usuário tentou acessar ou para `/dashboard`.
- **Rotas protegidas** – `/dashboard`, `/obras`, `/obras/nova`, `/obras/:id` exigem login. Sem token, redireciona para `/login`.
- **AuthContext** – Guarda `token` e `user` no `localStorage`. Métodos `login()` e `logout()`.
- **Botão Sair** – No Dashboard (ícone de logout), limpa sessão e redireciona para `/`.

### Primeiro acesso (dev)
1. Subir a API e rodar o seed: `cd apps/api && npx ts-node -r tsconfig-paths/register src/seed-dev.ts` (ou o script que existir).
2. O seed cria empresa e usuário **dev@obradupla.local** com senha **123456** (ou o valor de `DEV_USER_PASSWORD`).
3. No frontend, acessar `/login` e entrar com esse e-mail e senha.

### Produção
- Definir **JWT_SECRET** forte no ambiente da API.
- Definir **VITE_API_URL** no build do frontend para apontar para a API real.
- Novos usuários: criar via **POST /users** (requer estar logado como usuário da mesma company). O primeiro usuário de cada empresa deve ser criado via seed ou fluxo de cadastro de empresa (a implementar).
