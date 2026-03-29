# API na **Oracle Cloud** (Always Free)

Dá para correr a **nesta API** (Nest + Prisma) numa VM **grátis** com RAM de sobra — **sem pagar** o Render Standard. O custo é **tempo e manutenção**: és tu que geres a máquina, firewall, HTTPS e atualizações.

---

## O que ganhas / o que perdes

| | |
|--|--|
| **Vantagem** | Muita **RAM** no free tier (VM **Ampere A1**: até **24 GB no total** na conta free, repartidos por VMs — ex.: uma VM com **6 GB** já resolve OOM com folga). |
| **Desvantagem** | Não é “clicar deploy”: **SSH**, **Linux**, **domínio** + **HTTPS** (recomendado; o site Netlify é HTTPS e navegadores bloqueiam muitas vezes API só em `http://`). |
| **Conta** | A Oracle costuma pedir **cartão** para verificação; **Always Free** não cobra pelos recursos free se ficares dentro dos limites — lê as [regras atuais](https://www.oracle.com/cloud/free/). |

---

## Arquitetura (mantém o que já tens)

- **Postgres:** continua no **Supabase** (`DATABASE_URL` igual).
- **Site:** continua na **Netlify**; mudas só **`VITE_API_URL`** para o URL público da API na Oracle (HTTPS).
- **Esta VM:** só corre **Node** (a pasta `apps/api` compilada).

---

## 1. Criar a VM (resumo)

1. [Oracle Cloud Console](https://cloud.oracle.com/) → **Compute** → **Instances** → **Create instance**.
2. **Image:** **Canonical Ubuntu 22.04** (ou 24.04) **aarch64** (ARM64).
3. **Shape:** **Ampere A1 Flex** (Always Free elegível). Exemplo estável para a API: **1 OCPU + 6 GB RAM** (ajusta dentro do teu limite free total).
4. **Networking:** coloca a VM numa **VCN** com **IP público** (ou liga um depois).
5. **SSH key:** gera / cola a tua chave pública (aceso `ssh ubuntu@<IP_PUBLICO>` — o user pode ser `ubuntu` ou `opc` conforme a imagem; a consola indica).

**Listas de segurança (Security List)** da subnet / VCN — entradas típicas:

- **22** (SSH) — idealmente **só do teu IP**, não do mundo inteiro.
- **80** e **443** (HTTP/HTTPS) — `0.0.0.0/0` para o Caddy emitir certificado e servir a API.

**Firewall na VM** (depois do primeiro login):

```bash
sudo apt update && sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Node.js + projeto na VM

Na VM (Ubuntu ARM64):

```bash
# Node 20 LTS (via NodeSource — confere o snippet atual em https://github.com/nodesource/distributions)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

sudo npm i -g pnpm
```

**Código:**

- **Repo público:** `git clone https://github.com/TEU_USER/obra-dupla.git && cd obra-dupla`
- **Repo privado:** usa **token** ou **SSH deploy key**.

Depois:

```bash
cd obra-dupla/apps/api
cp .env.example .env
nano .env   # DATABASE_URL (Supabase), JWT_SECRET, HOST=0.0.0.0, PORT=3005, opcionais R2/SUPABASE…
pnpm install
pnpm run build
```

**Migrações:** faz `pnpm exec prisma migrate deploy` **aqui** (com rede até ao Supabase) **ou** aplica SQL no painel Supabase como em [`APLICAR-MIGRACAO-SUPABASE.md`](APLICAR-MIGRACAO-SUPABASE.md).

**Arranque com PM2** (reinicia se a VM reiniciar):

```bash
sudo npm i -g pm2
cd /home/ubuntu/obra-dupla/apps/api
pm2 start npm --name obra-api -- start
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# segue o comando que o pm2 startup imprimir
```

Confirma: `curl -s http://127.0.0.1:3005/health`

---

## 3. HTTPS na frente (Caddy + domínio)

O ideal é ter um **domínio** (podes usar um subdomínio tipo `api.teudominio.com`) com **DNS A** → **IP público** da VM.

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Ficheiro `/etc/caddy/Caddyfile` (exemplo — substitui o host):

```caddyfile
api.teudominio.com {
    reverse_proxy 127.0.0.1:3005
}
```

```bash
sudo systemctl reload caddy
```

Caddy obtém **Let’s Encrypt** automaticamente. Depois **`VITE_API_URL`** na Netlify = `https://api.teudominio.com` (sem `/` no fim) + novo deploy.

---

## 4. Atualizar a API depois de um `git push`

Na VM:

```bash
cd ~/obra-dupla && git pull
cd apps/api && pnpm install && pnpm run build && pm2 restart obra-api
```

---

## 5. Armadilhas comuns

| Problema | O quê fazer |
|----------|-------------|
| **Capacidade Ampere esgotada** na região | Escolhe **outra região** ou tenta noutro dia. |
| **Prisma / build a falhar** em ARM | Com Node 20 e `@prisma/client` recente costuma **funcionar** em `linux-arm64`; garante `pnpm run build` na própria VM. |
| **API acessível por IP mas o site não chama** | Site em **HTTPS** precisa de API em **HTTPS** (domínio + Caddy). |
| **Esquecer env** | Copia as mesmas variáveis críticas do Render (`DATABASE_URL`, `JWT_SECRET`, storage, etc.). |

---

## Resumo

- **Sim**, dá para substituir o **Render** pela **Oracle Always Free** com **bastante RAM**.
- **Não** é tão fácil como o Render: **VM + SSH + PM2 + Caddy + domínio**.
- Se quiseres **zero VPS**, as alternativas continuam a ser **Railway/Fly** (PaaS) ou **pagar Standard no Render** para **2 GB** sem gerir servidor.
