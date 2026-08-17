$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

$nodeVersionText = (& node -p "process.versions.node").Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($nodeVersionText)) {
    throw "Node.js não foi encontrado no PATH."
}
$nodeVersion = [version]$nodeVersionText
if ($nodeVersion -lt [version]"22.12.0") {
    throw "Node.js 22.12 ou superior é obrigatório. Detectado: $nodeVersionText."
}

foreach ($diretorio in @("frontend", "automation-worker")) {
    $caminho = Join-Path $root $diretorio
    Push-Location $caminho
    try {
        Write-Host "Gerando lockfile em $diretorio com Node $nodeVersionText..."
        npm install --package-lock-only --ignore-scripts --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao gerar package-lock.json em $diretorio."
        }
        $lockPath = Join-Path $caminho "package-lock.json"
        if (-not (Test-Path -LiteralPath $lockPath)) {
            throw "O package-lock.json não foi criado em $diretorio."
        }
        $lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
        if ([int]$lock.lockfileVersion -lt 3) {
            throw "Lockfile incompatível em ${diretorio}: lockfileVersion $($lock.lockfileVersion)."
        }
    } finally {
        Pop-Location
    }
}

Write-Host "Lockfiles gerados com sucesso."
Write-Host "Revise e versione frontend/package-lock.json e automation-worker/package-lock.json."
