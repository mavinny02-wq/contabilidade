$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Test-Path ".env")) {
    throw "Crie o arquivo .env a partir de .env.example."
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "altere-este-segredo-de-sessao|altere-este-token") {
    throw "O arquivo .env ainda contém segredos de exemplo."
}

$workerHealth = Invoke-RestMethod -Uri "http://localhost:8088/automation/health" -TimeoutSec 15
$flows = Invoke-RestMethod -Uri "http://localhost:8088/automation/flows" -TimeoutSec 15

Write-Host "Worker: $($workerHealth.status)"
Write-Host "Versão: $($workerHealth.versao)"
Write-Host "Sessões ativas: $($workerHealth.sessoesInterativasAtivas)"
Write-Host ""
Write-Host "Fluxos registrados:"
$flows.fluxos | ForEach-Object { Write-Host "- $_" }

$expected = @(
    "SEFAZ_SP_PORTAL::CERTIDAO_SP_SEFAZ_NAO_INSCRITOS",
    "PGE_SP_PORTAL::CERTIDAO_SP_PGE_DIVIDA_ATIVA"
)

foreach ($flow in $expected) {
    if ($flows.fluxos -notcontains $flow) {
        throw "Fluxo não registrado no worker: $flow"
    }
}

Write-Host ""
Write-Host "Preflight técnico dos portais estaduais concluído."
Write-Host "Isso não substitui consulta autorizada, CAPTCHA real, PDF real e validação dos seletores atuais."
