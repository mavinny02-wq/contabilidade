[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$StartupPath = Join-Path $RepoRoot 'scripts\start-compose-sequential.ps1'
$StartupBatPath = Join-Path $RepoRoot 'scripts\start-compose-sequential.bat'
$DevComposePath = Join-Path $RepoRoot 'compose.dev.yaml'
$NginxPath = Join-Path $RepoRoot 'frontend\nginx.conf'
$DatabaseValidationPath = Join-Path $RepoRoot 'scripts\validate-database-state.bat'

function Assert-Contract {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "[PRIMA_COMPOSE_STARTUP_CONTRACT] $Message"
    }
}

foreach ($path in @(
    $StartupPath,
    $StartupBatPath,
    $DevComposePath,
    $NginxPath,
    $DatabaseValidationPath
)) {
    Assert-Contract (Test-Path -LiteralPath $path -PathType Leaf) "Arquivo ausente: $path"
}

$tokens = $null
$parseErrors = $null
$startupAst = [System.Management.Automation.Language.Parser]::ParseFile(
    $StartupPath,
    [ref]$tokens,
    [ref]$parseErrors
)
Assert-Contract ($parseErrors.Count -eq 0) 'Parser falhou no startup Compose.'

$startupSource = Get-Content -LiteralPath $StartupPath -Raw
$startupBatSource = Get-Content -LiteralPath $StartupBatPath -Raw
$devComposeSource = Get-Content -LiteralPath $DevComposePath -Raw
$nginxSource = Get-Content -LiteralPath $NginxPath -Raw
$databaseSource = Get-Content -LiteralPath $DatabaseValidationPath -Raw

$upCalls = @(
    $startupAst.FindAll({
        param($node)
        $node -is [System.Management.Automation.Language.CommandAst] -and
        $node.GetCommandName() -eq 'Invoke-Compose'
    }, $true) |
        Where-Object { $_.Extent.Text -match "(?s)-Arguments\s+@\(\s*'up'" }
)
Assert-Contract ($upCalls.Count -eq 1) `
    "Startup deve possuir exatamente uma transicao Compose up; encontrado: $($upCalls.Count)."

foreach ($requiredToken in @(
    "'up'",
    "'--no-build'",
    "'-d'",
    "'--remove-orphans'",
    "'--wait'",
    "'--wait-timeout'"
)) {
    Assert-Contract ($upCalls[0].Extent.Text.Contains($requiredToken)) `
        "Compose up nao contem $requiredToken."
}

foreach ($forbidden in @(
    '--no-deps',
    '--force-recreate',
    'Remove-DevAuthContainers',
    'Start-ContabilidadeStartupProbe',
    'Invoke-ContabilidadeStartupProbeRequest',
    "Invoke-Compose -Arguments @('stop'",
    "Invoke-Compose -Arguments @('rm'"
)) {
    Assert-Contract (-not $startupSource.Contains($forbidden)) `
        "Startup ainda contem fluxo customizado proibido: $forbidden"
}

foreach ($service in @(
    'postgres',
    'postgres-bootstrap',
    'keycloak',
    'backend',
    'automation-worker',
    'frontend'
)) {
    Assert-Contract ($startupSource.Contains("'$service'")) `
        "Servico obrigatorio nao esta no contrato do startup: $service"
}

Assert-Contract ($startupSource.Contains('PRIMA_SINGLE_COMPOSE_UP_WAIT')) `
    'Startup nao declara o modelo PRIMA de Compose unico.'
Assert-Contract ($startupSource.Contains('Frontend SPA')) `
    'Startup nao valida HTTP 200 da raiz do frontend.'
Assert-Contract ($startupSource.Contains('Keycloak realm pelo proxy frontend')) `
    'Startup nao valida o realm Keycloak pelo frontend.'
Assert-Contract ($startupSource.Contains("@('exec', '-T', 'frontend', 'nginx', '-t')")) `
    'nginx -t pos-start deixou de ser obrigatorio.'
Assert-Contract ($startupBatSource.Contains('stack completa pelo Docker Compose')) `
    'BAT de transicao nao comunica a stack completa.'

Assert-Contract ($devComposeSource -match '(?m)^\s*APP_SECURITY_ENABLED:\s*"true"\s*$') `
    'Modo dev deve habilitar seguranca do backend.'
Assert-Contract ($devComposeSource -match '(?m)^\s*APP_AUTH_ENABLED:\s*"true"\s*$') `
    'Modo dev deve habilitar autenticacao do frontend.'
Assert-Contract ($devComposeSource -match '(?m)^\s*APP_ENVIRONMENT:\s*LOCAL\s*$') `
    'Modo dev deve declarar APP_ENVIRONMENT=LOCAL.'

Assert-Contract ($nginxSource.Contains('root /usr/share/nginx/html;')) `
    'Nginx nao declara a raiz do SPA.'
Assert-Contract ($nginxSource.Contains('index index.html;')) `
    'Nginx nao declara index.html.'
Assert-Contract ($nginxSource.Contains('location = /index.html')) `
    'Nginx nao protege a resolucao exata de /index.html.'
Assert-Contract ($nginxSource.Contains('try_files /index.html =404;')) `
    'Nginx nao transforma index ausente em 404 deterministico.'

Assert-Contract (-not ($databaseSource -match '(?i)Keycloak\s+(omitido|nao sera exigido)')) `
    'Validacao dev ainda omite o schema Keycloak.'
Assert-Contract ($databaseSource.Contains('[DB-VALIDATION 1/2]')) `
    'Validacao do schema Keycloak nao esta ativa.'
Assert-Contract ($databaseSource.Contains('[DB-VALIDATION 2/2]')) `
    'Validacao Flyway 2/2 nao esta ativa.'

Write-Host '[OK] Contrato PRIMA: uma unica transicao Compose sobe PostgreSQL, bootstrap, Keycloak e aplicacao; SPA root protegida.' -ForegroundColor Green
