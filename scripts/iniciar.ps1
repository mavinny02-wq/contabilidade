$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Warning "O arquivo .env foi criado. Altere todas as senhas antes de produção."
}

docker compose up -d --build
docker compose ps
Write-Host ""
Write-Host "Aplicação: http://localhost:8088"
Write-Host "Keycloak:  http://localhost:8088/auth/admin"
