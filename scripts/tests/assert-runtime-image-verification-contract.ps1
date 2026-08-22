[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptsRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$VerifyPath = Join-Path $ScriptsRoot 'verify-runtime-images.ps1'
$SequentialStartupPath = Join-Path $ScriptsRoot 'start-compose-sequential.ps1'
$EntrypointPath = Join-Path $ScriptsRoot '..\frontend\docker-entrypoint.d\40-runtime-config.sh'
$FrontendContractPath = Join-Path $ScriptsRoot '..\frontend\scripts\test-runtime-nginx-auth.sh'

function Assert-Contract {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "[RUNTIME_IMAGE_VERIFICATION_CONTRACT] $Message"
    }
}

foreach ($path in @($VerifyPath, $SequentialStartupPath, $EntrypointPath, $FrontendContractPath)) {
    Assert-Contract (Test-Path -LiteralPath $path -PathType Leaf) "Arquivo ausente: $path"
}

$tokens = $null
$errors = $null
$verifyAst = [System.Management.Automation.Language.Parser]::ParseFile(
    $VerifyPath,
    [ref]$tokens,
    [ref]$errors
)
Assert-Contract ($errors.Count -eq 0) 'Parser falhou em verify-runtime-images.ps1.'

$verifySource = Get-Content -LiteralPath $VerifyPath -Raw
$startupSource = Get-Content -LiteralPath $SequentialStartupPath -Raw
$entrypointSource = Get-Content -LiteralPath $EntrypointPath -Raw
$frontendContractSource = Get-Content -LiteralPath $FrontendContractPath -Raw

foreach ($requiredName in @(
    'backend-files',
    'frontend-files',
    'frontend-dev-config',
    'frontend-auth-config',
    'automation-worker-files'
)) {
    Assert-Contract ($verifySource.Contains("Name = '$requiredName'")) `
        "Contrato runtime ausente: $requiredName"
}

Assert-Contract (-not $verifySource.Contains('nginx -t')) `
    'A verificacao pre-start nao pode executar nginx -t fora da rede Compose.'
Assert-Contract ($verifySource.Contains('CONTABILIDADE_NGINX_VALIDATE=false')) `
    'A renderizacao pre-start deve desabilitar somente a resolucao Nginx dependente da rede Compose.'
Assert-Contract (-not $verifySource.Contains('grep -q "')) `
    'Comando runtime nao pode transportar padrao grep com aspas aninhadas pelo binder do Windows PowerShell 5.1.'
Assert-Contract (-not $verifySource.Contains('grep -Fq "')) `
    'Comando runtime nao pode transportar padrao grep com aspas aninhadas pelo binder do Windows PowerShell 5.1.'
Assert-Contract ($verifySource.Contains('RUNTIME_IMAGE_VALIDATION_FAILED')) `
    'Falha do contrato interno da imagem deve ter categoria propria.'
Assert-Contract ($verifySource.Contains('[string]$Result.StdErr')) `
    'Diagnostico deve incluir stderr.'
Assert-Contract ($verifySource.Contains('[string]$Result.StdOut')) `
    'Diagnostico deve incluir stdout.'

Assert-Contract ($startupSource.Contains("@('exec', '-T', 'frontend', 'nginx', '-t')")) `
    'nginx -t deve continuar sendo executado depois do startup, dentro da rede Compose.'
Assert-Contract (-not ($entrypointSource -match '(?im)^#.*keycloak.*omitted')) `
    'Include de auth desabilitado nao pode conter referencia textual a Keycloak.'
Assert-Contract ($frontendContractSource.Contains("grep -Fiq 'keycloak'")) `
    'Teste frontend deve detectar referencia a Keycloak sem depender de capitalizacao.'

$stringCommands = @(
    $verifyAst.FindAll({
        param($node)
        $node -is [System.Management.Automation.Language.StringConstantExpressionAst]
    }, $true) |
        ForEach-Object { $_.Value } |
        Where-Object { $_ -match 'APP_AUTH_ENABLED=|test -f /app|node_modules/playwright' }
)
Assert-Contract ($stringCommands.Count -eq 5) `
    "Quantidade inesperada de comandos runtime: $($stringCommands.Count); esperado: 5."
foreach ($command in $stringCommands) {
    Assert-Contract (-not $command.Contains('"')) `
        'Um comando runtime ainda contem aspas duplas aninhadas.'
}

Write-Host '[OK] Verificacao runtime: cinco contratos binder-safe; Nginx validado somente dentro da rede Compose.' -ForegroundColor Green
