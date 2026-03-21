# Render: parar “JavaScript heap out of memory”

## 1) Start Command (obrigatório)

No serviço Web, **Root Directory** = `apps/api` e:

**Start Command:** `npm start`

**Não uses** só `node dist/main.js` — assim **perdes** o `--max-old-space-size=384` definido no `package.json`.

Se insistires em `node` à mão:

```bash
node --max-old-space-size=384 dist/main.js
```

## 2) Variável opcional (reforço)

**Environment →** `NODE_OPTIONS` = `--max-old-space-size=384`

## 3) Confirmação nos logs

Após deploy, nos logs da API deve aparecer uma linha tipo:

`[heap] heap_size_limit_mb=384` (ou próximo)

Se aparecer **~256**, o limite **não** está aplicado → volta ao passo 1.

## 4) Plano grátis

O instance **free** tem **pouca RAM**. Mesmo com tudo certo, **evita** guardar ficheiros grandes em **base64** na base de dados; usa **R2 / URL** (`fileUrl`).

## 5) Se continuar a cair

- Sobe para um plano com **mais RAM**, ou  
- Reduz dados legados com `payload` gigante na tabela `ActivityEvent` (auditoria).
