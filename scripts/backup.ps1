$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path ".\dados\backups" | Out-Null
New-Item -ItemType Directory -Force -Path ".\dados\documentos" | Out-Null

docker compose exec -T postgres sh -c "pg_dump -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" -Fc -f /backups/contabilidade-$timestamp.dump"
if ($LASTEXITCODE -ne 0) { throw "Falha no backup do PostgreSQL." }

docker run --rm `
  -v "${PWD}\dados\documentos:/source:ro" `
  -v "${PWD}\dados\backups:/backup" `
  alpine:3.21 `
  sh -c "tar -czf /backup/documentos-$timestamp.tar.gz -C /source ."

if ($LASTEXITCODE -ne 0) { throw "Falha no backup dos documentos." }

Write-Host "Backup concluído em dados\backups com identificador $timestamp"
