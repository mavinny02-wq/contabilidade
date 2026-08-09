param(
    [string]$WorkerUrl = "http://localhost:8088/automation",
    [switch]$ExigirCredenciais
)

$ErrorActionPreference = "Stop"
$baseUrl = $WorkerUrl.TrimEnd('/')

$health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 20
$flows = Invoke-RestMethod -Uri "$baseUrl/flows" -TimeoutSec 20

$codigoEsperado = "SERPRO::CERTIDAO_FEDERAL_RFB_PGFN"
if ($flows.fluxos -notcontains $codigoEsperado) {
    throw "O fluxo oficial Serpro não está registrado no worker."
}

$diagnostico = @($flows.diagnosticos) | Where-Object {
    $_.provedorCodigo -eq "SERPRO" -and
    $_.operacao -eq "CERTIDAO_FEDERAL_RFB_PGFN"
} | Select-Object -First 1

if ($null -eq $diagnostico) {
    throw "O worker não publicou o diagnóstico do fluxo Serpro."
}

Write-Host "Worker: $($health.status)"
Write-Host "Versão: $($health.versao)"
Write-Host "Fluxo: $codigoEsperado"
Write-Host "Modo: $($diagnostico.modo)"
Write-Host "Destino: $($diagnostico.destino)"
Write-Host "Autenticação: $($diagnostico.modoAutenticacao)"
Write-Host "Configurado: $($diagnostico.configurado)"

if ($diagnostico.modo -ne "API") {
    throw "O provider SERPRO foi registrado com modo diferente de API."
}

if ($ExigirCredenciais -and -not [bool]$diagnostico.configurado) {
    throw "As credenciais Serpro ainda não estão disponíveis no ambiente do worker."
}

Write-Host ""
Write-Host "Preflight concluído. Nenhuma consulta à API foi executada e nenhuma cobrança foi gerada por este script."
