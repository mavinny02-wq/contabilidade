$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Test-Path ".env")) {
    throw "Crie o arquivo .env a partir de .env.example e altere os segredos."
}

$envContent = Get-Content ".env" -Raw
if ($envContent -match "altere-esta-senha|altere-este-token") {
    throw "O arquivo .env ainda contém segredos de exemplo."
}

docker compose -f compose.yaml -f compose.onpremise.yaml up -d --build
docker compose -f compose.yaml -f compose.onpremise.yaml ps
