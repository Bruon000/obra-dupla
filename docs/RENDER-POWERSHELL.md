# Render + PowerShell — o que dá para fazer pelo terminal

## O que **não** dá para fazer 100% só no PowerShell

Na **primeira vez**, você precisa **criar o Web Service** no painel do Render (conectar o GitHub, colar `Root Directory`, env vars, etc.) **ou** usar **Blueprint** no dashboard apontando para o `render.yaml` do repo.

Depois disso, **quase tudo** pode ser repetido pelo PC com Git ou com a **Render CLI**.

---

## Opção A — Mais simples: **só Git** (recomendado)

Com o serviço já criado e **Auto-Deploy** ligado no branch `main` (ou o que você usa):

```powershell
cd C:\Users\BruoN\obra-dupla
git add .
git commit -m "deploy: ajustes API"
git push origin main
```

O Render **sozinho** puxa o código e faz build + deploy. Não precisa instalar nada além do Git.

---

## Opção B — **Render CLI** (disparar deploy / ver logs pelo PowerShell)

### 1) Instalar o CLI no Windows

1. Abra: [github.com/render-oss/cli/releases/latest](https://github.com/render-oss/cli/releases/latest)  
2. Baixe o `.zip` do **Windows amd64** (nome pode ser tipo `render_*_windows_amd64.zip`).  
3. Extraia o executável `render.exe` para uma pasta que esteja no **PATH** (ex.: `C:\Tools\render\`) e adicione essa pasta em *Variáveis de ambiente → Path*.

Confirme:

```powershell
render --version
```

### 2) Login (uma vez)

```powershell
render login
```

Abre o navegador → **Generate token** → volta no terminal e escolhe o **workspace**.

### 3) Disparar deploy manual

```powershell
# Lista serviços (modo interativo — escolhe o da API)
render services

# Ou, com o ID do serviço (copiado do painel Render → Settings):
render deploys create srv-xxxxxxxx --confirm
```

Ver logs:

```powershell
render logs --help
```

*(O comando exato de logs pode variar; use `render help` para ver os subcomandos atuais.)*

---

## Opção C — Validar o `render.yaml` antes de subir

Na raiz do repo:

```powershell
cd C:\Users\BruoN\obra-dupla
render blueprints validate .\render.yaml
```

*(Se o CLI disser que o arquivo está OK, ajuda a usar **New Blueprint** no Render com menos erro.)*

---

## Resumo

| Objetivo | PowerShell |
|----------|------------|
| **Subir código novo** | `git push` (se auto-deploy ligado) |
| **Deploy manual / logs** | Render CLI (`render login`, `render deploys create …`) |
| **Criar serviço do zero** | Painel Render ou Blueprint na web (uma vez) |

Variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, etc.) continuam sendo editadas no **dashboard** do Render (ou via Blueprint/IaC depois, se você evoluir).
