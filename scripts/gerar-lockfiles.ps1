$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

foreach ($diretorio in @("frontend", "automation-worker")) {
    Push-Location (Join-Path $root $diretorio)
    try {
        npm install --package-lock-only --ignore-scripts --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw "Falha ao gerar package-lock.json em $diretorio." }
    } finally {
        Pop-Location
    }
}

Write-Host "Lockfiles gerados. Revise e versione frontend/package-lock.json e automation-worker/package-lock.json."
