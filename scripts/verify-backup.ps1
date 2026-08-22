[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ManifestPath
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupDirectory = Join-Path $projectRoot "dados\backups"

if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
    $latest = Get-ChildItem -LiteralPath $backupDirectory -Filter "manifest-*.json" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
    if ($null -eq $latest) {
        throw "Nenhum manifesto de backup foi encontrado em $backupDirectory."
    }
    $ManifestPath = $latest.FullName
}
elseif (-not [System.IO.Path]::IsPathRooted($ManifestPath)) {
    $ManifestPath = Join-Path $projectRoot $ManifestPath
}

$resolvedManifest = (Resolve-Path -LiteralPath $ManifestPath).Path
$manifestDirectory = Split-Path -Parent $resolvedManifest
$manifest = Get-Content -LiteralPath $resolvedManifest -Raw | ConvertFrom-Json

if ($manifest.schemaVersion -ne "1.0") {
    throw "Versão de schema do manifesto não suportada: $($manifest.schemaVersion)"
}
if ([string]::IsNullOrWhiteSpace([string]$manifest.backupId)) {
    throw "O manifesto não informa backupId."
}
$applicationVersion = [string]$manifest.applicationVersion
if ([string]::IsNullOrWhiteSpace($applicationVersion) -or
    $applicationVersion -notmatch '^[A-Za-z0-9._-]+$') {
    throw "O manifesto não informa uma applicationVersion válida."
}

$createdAt = [DateTimeOffset]::MinValue
if (-not [DateTimeOffset]::TryParse([string]$manifest.createdAt, [ref]$createdAt)) {
    throw "O manifesto possui createdAt inválido."
}

$components = @($manifest.components)
if ($components.Count -lt 2) {
    throw "O manifesto deve conter ao menos os componentes PostgreSQL e documentos."
}

$names = @{}
$files = @{}
$expectedNames = @{
    postgresql = $true
    documents = $true
}

foreach ($component in $components) {
    $name = [string]$component.name
    $fileName = [string]$component.file
    $expectedHash = ([string]$component.sha256).ToLowerInvariant()
    $expectedSize = [Int64]$component.sizeBytes
    $nameKey = $name.ToLowerInvariant()
    $fileKey = $fileName.ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($name) -or $names.ContainsKey($nameKey)) {
        throw "Nome de componente ausente ou duplicado: $name"
    }
    if ([string]::IsNullOrWhiteSpace($fileName) -or $files.ContainsKey($fileKey)) {
        throw "Nome de arquivo ausente ou duplicado: $fileName"
    }
    $names[$nameKey] = $true
    $files[$fileKey] = $true

    if ([System.IO.Path]::IsPathRooted($fileName) -or [System.IO.Path]::GetFileName($fileName) -ne $fileName) {
        throw "O manifesto contém caminho de arquivo inseguro: $fileName"
    }
    if ($expectedSize -lt 0) {
        throw "Tamanho inválido para $fileName."
    }
    if ($expectedHash -notmatch '^[0-9a-f]{64}$') {
        throw "SHA-256 inválido para $fileName."
    }

    $componentPath = Join-Path $manifestDirectory $fileName
    if (-not (Test-Path -LiteralPath $componentPath -PathType Leaf)) {
        throw "Componente ausente: $componentPath"
    }

    $actualSize = (Get-Item -LiteralPath $componentPath).Length
    if ($actualSize -ne $expectedSize) {
        throw "Tamanho divergente em $fileName. Esperado=$expectedSize Atual=$actualSize"
    }

    $actualHash = (Get-FileHash -LiteralPath $componentPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
        throw "SHA-256 divergente em $fileName."
    }

    [void]$expectedNames.Remove($nameKey)
    Write-Host "[OK] $name — $fileName — $actualSize bytes"
}

if ($expectedNames.Count -gt 0) {
    throw "Componentes obrigatórios ausentes: $([string]::Join(', ', @($expectedNames.Keys)))"
}

Write-Host "[OK] Manifesto verificado: $resolvedManifest"
Write-Host "[OK] BackupId=$($manifest.backupId) Versão=$($manifest.applicationVersion) CriadoEm=$createdAt"
