param(
    [switch]$Pull,
    [switch]$RequireDigest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force
$EnvFile = Join-Path $ProjectDir '.env'
$EnvExample = Join-Path $ProjectDir '.env.example'
$VersionFile = Join-Path $ProjectDir 'VERSION'
$ComposeBase = Join-Path $ProjectDir 'compose.yaml'
$ComposeMode = Join-Path $ProjectDir 'compose.onpremise.yaml'
$OverrideDir = Join-Path $ProjectDir '.docker-local\artifact-build'
$ComposeOverride = Join-Path $OverrideDir 'compose.local-artifacts.yaml'
$SequentialScript = Join-Path $PSScriptRoot 'start-compose-sequential.ps1'
$RuntimeImageVerifier = Join-Path $PSScriptRoot 'verify-runtime-images.ps1'
$LockPath = Join-Path $OverrideDir 'deploy-onpremise.lock'

function Write-Section {
    param([string]$Message)
    Write-Host ''
    Write-Host "[DEPLOY-ONPREMISE] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Write-Utf8NoBomLf {
    param([string]$Path, [string]$Content)
    $normalized = $Content.Replace("`r`n", "`n").Replace("`r", "`n")
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $normalized, $encoding)
}

function Get-DotEnvValue {
    param([string]$Name)

    $processValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
        return $processValue.Trim()
    }

    if (-not (Test-Path -LiteralPath $EnvFile)) {
        return $null
    }

    foreach ($line in Get-Content -LiteralPath $EnvFile) {
        if ($line -match '^\s*#') {
            continue
        }
        if ($line -match ('^\s*' + [regex]::Escape($Name) + '\s*=\s*(.*)\s*$')) {
            $value = $Matches[1].Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            return $value
        }
    }

    return $null
}

function Resolve-ImageReference {
    param([string]$VariableName, [string]$DefaultValue)

    $value = Get-DotEnvValue $VariableName
    if ([string]::IsNullOrWhiteSpace($value)) {
        return $DefaultValue
    }
    if ($value -match '[\r\n\s]') {
        throw "Referencia de imagem invalida em $VariableName."
    }
    return $value
}

function Assert-ImageAvailable {
    param([string]$Reference)

    $state = Test-ContabilidadeDockerImage -Image $Reference
    if (-not $state.Available) {
        throw @"
Imagem nao encontrada localmente: $Reference
Publique/carregue a imagem antes do deploy ou execute START_CONTABILIDADE.bat onpremise pull.
Categoria: $($state.Category). Exit code: $($state.ExitCode).
Nenhum build sera executado neste servidor.
"@
    }
}

foreach ($required in @(
    $VersionFile,
    $EnvExample,
    $ComposeBase,
    $ComposeMode,
    $SequentialScript,
    $RuntimeImageVerifier
)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Arquivo obrigatorio ausente: $required"
    }
}

$dockerInfo = Invoke-ContabilidadeDocker -Arguments @('info') -AllowFailure -Quiet
if (-not $dockerInfo.Success) {
    $category = Get-ContabilidadeDockerFailureCategory -Content $dockerInfo.Output
    throw "[$category] Docker daemon indisponivel para deploy. Exit code: $($dockerInfo.ExitCode)."
}
$composeVersion = Invoke-ContabilidadeDocker -Arguments @('compose', 'version') -AllowFailure -Quiet
if (-not $composeVersion.Success) {
    throw "[DOCKER_PERMISSION_OR_API_FAILURE] Docker Compose v2 indisponivel. Exit code: $($composeVersion.ExitCode)."
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw '.env ausente. O deploy on-premise exige um arquivo revisado com segredos reais.'
}

$unsafeMarkers = @('altere-esta-senha', 'altere-este-token', 'altere-este-segredo')
$envContent = Get-Content -LiteralPath $EnvFile -Raw
foreach ($marker in $unsafeMarkers) {
    if ($envContent -match [regex]::Escape($marker)) {
        throw ".env ainda contem valor de exemplo: $marker"
    }
}

$version = (Get-Content -LiteralPath $VersionFile -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($version)) {
    throw 'Arquivo VERSION vazio.'
}

$backendImage = Resolve-ImageReference 'CONTABILIDADE_BACKEND_IMAGE' "contabilidade-backend:$version"
$frontendImage = Resolve-ImageReference 'CONTABILIDADE_FRONTEND_IMAGE' "contabilidade-frontend:$version"
$workerImage = Resolve-ImageReference 'CONTABILIDADE_WORKER_IMAGE' "contabilidade-automation-worker:$version"
$applicationImages = @($backendImage, $frontendImage, $workerImage)

Write-Section 'Imagens selecionadas'
Write-Host "Backend: $backendImage"
Write-Host "Frontend: $frontendImage"
Write-Host "Worker:   $workerImage"

foreach ($image in $applicationImages) {
    if ($RequireDigest -and $image -notmatch '@sha256:[a-fA-F0-9]{64}$') {
        throw "Deploy exige imagem fixada por digest, mas recebeu: $image"
    }
    if (-not $RequireDigest -and $image -notmatch '@sha256:[a-fA-F0-9]{64}$') {
        Write-Warn "Imagem nao esta fixada por digest: $image"
    }
}

$lockStream = $null
try {
    New-Item -ItemType Directory -Force -Path $OverrideDir | Out-Null
    try {
        $lockStream = [IO.File]::Open(
            $LockPath,
            [IO.FileMode]::OpenOrCreate,
            [IO.FileAccess]::ReadWrite,
            [IO.FileShare]::None
        )
    }
    catch {
        throw 'Outro deploy on-premise ja esta em execucao.'
    }

    if ($Pull) {
        Write-Section 'Baixando imagens publicadas'
        foreach ($image in $applicationImages) {
            $null = Invoke-ContabilidadeDocker -Arguments @('pull', $image)
        }
    }

    foreach ($image in $applicationImages) {
        Assert-ImageAvailable $image
    }

    Write-Section 'Verificando conteudo das imagens selecionadas'
    & $RuntimeImageVerifier `
        -BackendImage $backendImage `
        -FrontendImage $frontendImage `
        -WorkerImage $workerImage

    $override = @"
services:
  backend:
    image: $backendImage
    build: null
  frontend:
    image: $frontendImage
    build: null
  automation-worker:
    image: $workerImage
    build: null
"@
    Write-Utf8NoBomLf $ComposeOverride $override

    Write-Section 'Validando Compose sem build'
    $null = Invoke-ContabilidadeDocker -Arguments @(
        'compose', '--env-file', $EnvFile,
        '-f', $ComposeBase,
        '-f', $ComposeMode,
        '-f', $ComposeOverride,
        'config', '--quiet'
    )

    Write-Section 'Iniciando stack com imagens pre-construidas'
    $startup = & $SequentialScript -Mode onpremise -NoExit
    if ($null -eq $startup) {
        throw 'Startup sequencial on-premise nao retornou evidencia de conclusao.'
    }

    Write-Ok 'Deploy on-premise concluido sem executar Docker build ou limpar cache.'
    Write-Host 'Aplicacao: http://localhost:8088'
    exit 0
}
finally {
    if ($null -ne $lockStream) {
        $lockStream.Dispose()
    }
}
