param([string]$Servico = "")
$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if ([string]::IsNullOrWhiteSpace($Servico)) {
    docker compose logs --tail=200 -f
} else {
    docker compose logs --tail=200 -f $Servico
}
