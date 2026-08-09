$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location (Join-Path $root "backend")
try {
    $maven = if (Test-Path ".\mvnw.cmd") { ".\mvnw.cmd" } else { "mvn" }
    & $maven -DskipTests compile
    if ($LASTEXITCODE -ne 0) { throw "Falha na compilação do backend." }
} finally {
    Pop-Location
}

Push-Location (Join-Path $root "frontend")
try {
    npm ci
    npm run locale:validate
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha no build do frontend." }
} finally {
    Pop-Location
}

Push-Location (Join-Path $root "automation-worker")
try {
    npm ci
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha no build do worker." }
} finally {
    Pop-Location
}

Push-Location $root
try {
    docker compose config | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Falha na validação do Docker Compose." }
} finally {
    Pop-Location
}

Write-Host "Validação concluída. Nenhum teste foi executado."
