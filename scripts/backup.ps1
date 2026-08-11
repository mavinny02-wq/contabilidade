[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirectory = Join-Path $projectRoot "dados\backups"
$documentDirectory = Join-Path $projectRoot "dados\documentos"
$version = (Get-Content (Join-Path $projectRoot "VERSION") -Raw).Trim()

if ([string]::IsNullOrWhiteSpace($version) -or $version -notmatch '^[A-Za-z0-9._-]+$') {
    throw "VERSION contém um valor inválido para o manifesto de backup."
}

New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $documentDirectory | Out-Null

$databaseFileName = "contabilidade-$timestamp.dump"
$documentsFileName = "documentos-$timestamp.tar.gz"
$manifestFileName = "manifest-$timestamp.json"
$databasePath = Join-Path $backupDirectory $databaseFileName
$documentsPath = Join-Path $backupDirectory $documentsFileName
$manifestPath = Join-Path $backupDirectory $manifestFileName
$createdPaths = @($databasePath, $documentsPath, $manifestPath)

foreach ($path in $createdPaths) {
    if (Test-Path -LiteralPath $path) {
        throw "O arquivo de backup já existe: $path"
    }
}

try {
    docker compose exec -T postgres sh -c "pg_dump -U `"`$POSTGRES_USER`" -d `"`$POSTGRES_DB`" -Fc -f /backups/$databaseFileName"
    if ($LASTEXITCODE -ne 0) { throw "Falha no backup do PostgreSQL." }

    docker run --rm `
      -v "${documentDirectory}:/source:ro" `
      -v "${backupDirectory}:/backup" `
      alpine:3.21 `
      sh -c "tar -czf /backup/$documentsFileName -C /source ."

    if ($LASTEXITCODE -ne 0) { throw "Falha no backup dos documentos." }

    $components = @(
        [ordered]@{
            name = "postgresql"
            file = $databaseFileName
            format = "pg_dump_custom"
            sizeBytes = (Get-Item -LiteralPath $databasePath).Length
            sha256 = (Get-FileHash -LiteralPath $databasePath -Algorithm SHA256).Hash.ToLowerInvariant()
        },
        [ordered]@{
            name = "documents"
            file = $documentsFileName
            format = "tar_gzip"
            sizeBytes = (Get-Item -LiteralPath $documentsPath).Length
            sha256 = (Get-FileHash -LiteralPath $documentsPath -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    )

    $manifest = [ordered]@{
        schemaVersion = "1.0"
        backupId = $timestamp
        createdAt = [DateTimeOffset]::UtcNow.ToString("o")
        applicationVersion = $version
        components = $components
    }

    $json = $manifest | ConvertTo-Json -Depth 6
    $utf8SemBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($manifestPath, $json + [Environment]::NewLine, $utf8SemBom)

    & (Join-Path $PSScriptRoot "verify-backup.ps1") -ManifestPath $manifestPath
    if (-not $?) { throw "A verificação do manifesto recém-gerado falhou." }

    Write-Host "Backup concluído e verificado."
    Write-Host "Identificador: $timestamp"
    Write-Host "Manifesto: $manifestPath"
}
catch {
    foreach ($path in $createdPaths) {
        Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue
    }
    throw
}
