# Grava DATABASE_URL_DIRECT em apps/api/.env (conexão DIRETA Supabase :5432 para Prisma Migrate).
#
# O Read-Host do PowerShell muitas vezes NÃO recebe colagem — use uma destas formas:
#
#   1) Copie a URI no Supabase (Connect → Direct → URI), depois:
#      .\scripts\set-supabase-direct-url.ps1 -Clipboard
#
#   2) Linha de comando (aspas simples protegem caracteres especiais na senha):
#      .\scripts\set-supabase-direct-url.ps1 -Uri 'postgresql://postgres:SENHA@db.xxxx.supabase.co:5432/postgres'
#
#   3) Coloque a URI em UMA linha neste arquivo e rode sem argumentos:
#        apps\api\.supabase-direct-uri.txt
#
# Pegue a URI em: Supabase → Connect → Direct → URI (troque [YOUR-PASSWORD] pela senha do banco).

param(
    [string]$Uri = "",
    [switch]$Clipboard,
    [string]$FromFile = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envPath = Join-Path $repoRoot "apps\api\.env"
$defaultFile = Join-Path $repoRoot "apps\api\.supabase-direct-uri.txt"

if (-not (Test-Path $envPath)) {
    Write-Host "Arquivo não encontrado: $envPath" -ForegroundColor Red
    Write-Host "Crie o .env da API antes."
    exit 1
}

function Extract-PostgresUriFromText([string]$text) {
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    # Acha postgresql:// ou postgres:// em meio a outro texto (ex.: página inteira copiada).
    $m = [regex]::Match($text, "postgres(?:ql)?://[^\s'""<>\r\n]+", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($m.Success) { return $m.Value.Trim() }
    return $null
}

function Normalize-PostgresUri([string]$raw) {
    if ([string]::IsNullOrWhiteSpace($raw)) { return "" }
    $u = ($raw -replace "^\uFEFF", "").Trim().Trim('"').Trim("'")
    if ($u -match "\r?\n") {
        $u = (($u -split "`r`n|`n|`r") | ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -First 1)
    }
    if ($u -match "^postgres://") {
        $u = $u -replace "^postgres://", "postgresql://"
    }
    return $u
}

function Set-EnvVarInFile {
    param(
        [string]$Path,
        [string]$Name,
        [string]$Value
    )
    $escaped = $Value.Replace('"', '`"')
    $content = Get-Content $Path -Raw -ErrorAction SilentlyContinue
    if (-not $content) { $content = "" }
    if ($content -match "(?m)^$([regex]::Escape($Name))\s*=") {
        $content = [regex]::Replace($content, "(?m)^$([regex]::Escape($Name))\s*=.*$", "$Name=`"$escaped`"")
    }
    else {
        if ($content -notmatch "(\r?\n)$") { $content += "`r`n" }
        $content += "$Name=`"$escaped`"`r`n"
    }
    [System.IO.File]::WriteAllText($Path, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "OK: $Name gravado em $Path" -ForegroundColor Green
}

$url = ""
if ($Uri) {
    $url = Normalize-PostgresUri $Uri
}
elseif ($Clipboard) {
    Write-Host "Lendo da área de transferência..." -ForegroundColor Cyan
    $clipRaw = Get-Clipboard -Raw
    $url = Normalize-PostgresUri $clipRaw
    if ($url -notmatch "^postgresql://") {
        $extracted = Extract-PostgresUriFromText $clipRaw
        if ($extracted) {
            $url = Normalize-PostgresUri $extracted
            Write-Host "(URI extraída do texto colado.)" -ForegroundColor DarkGray
        }
    }
}
elseif ($FromFile) {
    if (-not (Test-Path $FromFile)) {
        Write-Host "Arquivo não encontrado: $FromFile" -ForegroundColor Red
        exit 1
    }
    $url = Normalize-PostgresUri (Get-Content -Path $FromFile -Raw)
}
elseif (Test-Path $defaultFile) {
    Write-Host "Usando primeira linha de: $defaultFile" -ForegroundColor Cyan
    $url = Normalize-PostgresUri (Get-Content -Path $defaultFile -Raw)
}
else {
    Write-Host ""
    Write-Host "=== URI Direct do Supabase (porta 5432) ===" -ForegroundColor Cyan
    Write-Host "O terminal costuma IGNORAR colagem no prompt. Use UMA destas opções:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  A) Copie a URI no Supabase e rode:" -ForegroundColor White
    Write-Host "     .\scripts\set-supabase-direct-url.ps1 -Clipboard"
    Write-Host ""
    Write-Host "  B) Ou crie o arquivo (uma linha só) e rode este script de novo:" -ForegroundColor White
    Write-Host "     $defaultFile"
    Write-Host ""
    Write-Host "  C) Ou passe na linha com aspas simples:" -ForegroundColor White
    Write-Host "     .\scripts\set-supabase-direct-url.ps1 -Uri 'postgresql://postgres:SENHA@db....supabase.co:5432/postgres'"
    Write-Host ""
    exit 2
}

if ($url.Length -lt 20) {
    Write-Host "Erro: URI vazia ou muito curta." -ForegroundColor Red
    Write-Host "Use -Clipboard (copie a URI antes) ou -Uri '...' ou o arquivo .supabase-direct-uri.txt"
    exit 1
}

# Placeholder do exemplo (host fictício db.SEU_PROJECT.supabase.co)
if ($url -match "(?i)SEU_PROJECT|YOUR_PROJECT|YOUR-PASSWORD|\[YOUR") {
    Write-Host "Erro: o HOST ainda está de EXEMPLO (ex.: db.SEU_PROJECT.supabase.co)." -ForegroundColor Red
    Write-Host "No Supabase → Connect → Direct → URI, copie a linha COMPLETA." -ForegroundColor Yellow
    Write-Host "O host real é db.<referencia>.supabase.co (a referência está em Project Settings → General → Project ID)."
    exit 1
}

if ($url -notmatch "^postgresql://") {
    $preview = if ($url.Length -gt 60) { $url.Substring(0, 60) + "..." } else { $url }
    Write-Host "Erro: na área de transferência NÃO há uma URI do Postgres válida." -ForegroundColor Red
    Write-Host "Trecho que veio na clipboard: $preview" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O que fazer:" -ForegroundColor Cyan
    Write-Host "  1) Abra o Supabase no NAVEGADOR (não copie comando do terminal)."
    Write-Host "  2) Project Settings (engrenagem) → Connect → aba Direct → tipo URI."
    Write-Host "  3) Substitua [YOUR-PASSWORD] pela senha do banco na própria linha."
    Write-Host "  4) Selecione SÓ a linha postgresql://... (ou clique no ícone copiar ao lado da URI)."
    Write-Host "  5) Rode de novo:  .\scripts\set-supabase-direct-url.ps1 -Clipboard"
    Write-Host ""
    Write-Host "Alternativa:  -Uri 'postgresql://postgres:SENHA@db....supabase.co:5432/postgres'"
    exit 1
}

Set-EnvVarInFile -Path $envPath -Name "DATABASE_URL_DIRECT" -Value $url

Write-Host ""
Write-Host "Próximo passo:" -ForegroundColor Yellow
Write-Host "  cd `"$repoRoot\apps\api`""
Write-Host "  npx prisma migrate deploy"
Write-Host ""
