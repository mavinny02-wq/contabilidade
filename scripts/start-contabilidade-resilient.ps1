param(
    [ValidateSet('dev')]
    [string]$Mode = 'dev',

    [string]$BuilderName = $(
        if ([string]::IsNullOrWhiteSpace($env:CONTABILIDADE_BUILDER_NAME)) {
            'contabilidade-runtime-builder'
        }
        else {
            $env:CONTABILIDADE_BUILDER_NAME
        }
    ),

    [switch]$NoAutoRecovery
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CoreSourceBat = Join-Path $PSScriptRoot 'start-contabilidade-core.bat'
$TemporaryCoreBat = Join-Path $ProjectDir '.START_CONTABILIDADE_CORE.runtime.bat'
$LogDir = Join-Path $ProjectDir '.docker-local\logs'
$LockPath = Join-Path $ProjectDir '.docker-local\artifact-build\buildkit-resilient.lock'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

New-Item -ItemType Directory -Force -Path $LogDir, (Split-Path -Parent $LockPath) | Out-Null

function Write-Section {
    param([string]$Message)
    Write-Host ''
    Write-Host "[BUILD-RESILIENTE] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Invoke-Docker {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [switch]$AllowFailure
    )

    & docker @Arguments
    $exitCode = $LASTEXITCODE
    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "Docker falhou: docker $($Arguments -join ' '). Exit code: $exitCode."
    }
    return $exitCode
}

function Restore-ProcessEnvironment {
    param([string]$Name, [AllowNull()][string]$Value)

    if ($null -eq $Value) {
        [Environment]::SetEnvironmentVariable($Name, $null, 'Process')
    }
    else {
        [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    }
}

function Ensure-DockerAndBuildx {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI nao encontrado.'
    }

    Invoke-Docker -Arguments @('info') | Out-Null
    Invoke-Docker -Arguments @('buildx', 'version') | Out-Null
}

function Remove-IsolatedBuilder {
    Write-Warn "Removendo somente o builder isolado '$BuilderName' e o cache dele."
    Write-Host 'Volumes PostgreSQL, documentos, backups, containers e imagens da aplicacao nao serao removidos.'
    Invoke-Docker -Arguments @('buildx', 'rm', '--force', $BuilderName) -AllowFailure | Out-Null
}

function Ensure-IsolatedBuilder {
    if ($BuilderName -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$') {
        throw "Nome de builder invalido: $BuilderName"
    }

    $inspection = (& docker buildx inspect $BuilderName 2>&1 | Out-String)
    $inspectExit = $LASTEXITCODE

    if ($inspectExit -eq 0) {
        if ($inspection -notmatch '(?m)^Driver:\s+docker-container\s*$') {
            throw "O builder '$BuilderName' existe, mas nao usa o driver docker-container."
        }

        Invoke-Docker -Arguments @('buildx', 'inspect', $BuilderName, '--bootstrap') | Out-Null
        Write-Ok "Builder isolado reutilizado: $BuilderName"
        return
    }

    Write-Section "Criando builder BuildKit isolado: $BuilderName"
    Invoke-Docker -Arguments @(
        'buildx', 'create',
        '--name', $BuilderName,
        '--driver', 'docker-container',
        '--driver-opt', 'default-load=true,restart-policy=unless-stopped',
        '--bootstrap'
    ) | Out-Null

    $created = (& docker buildx inspect $BuilderName 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0 -or $created -notmatch '(?m)^Driver:\s+docker-container\s*$') {
        throw "Nao foi possivel validar o builder isolado '$BuilderName'."
    }

    Write-Ok "Builder isolado criado: $BuilderName"
}

function Test-BuildKitSnapshotCorruption {
    param([string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(failed to prepare extraction snapshot|parent snapshot\s+sha256:[a-f0-9]+\s+does not exist|snapshot[^\r\n]*(does not exist|not found)|failed to get layer[^\r\n]*(not found|does not exist))'
}

function Invoke-CoreAttempt {
    param([int]$Attempt)

    $attemptLog = Join-Path $LogDir "START_CONTABILIDADE_RESILIENTE_${Timestamp}_tentativa${Attempt}.log"
    $oldBuilder = [Environment]::GetEnvironmentVariable('BUILDX_BUILDER', 'Process')
    $oldAttestations = [Environment]::GetEnvironmentVariable('BUILDX_NO_DEFAULT_ATTESTATIONS', 'Process')
    $oldBuildKit = [Environment]::GetEnvironmentVariable('DOCKER_BUILDKIT', 'Process')

    try {
        Copy-Item -LiteralPath $CoreSourceBat -Destination $TemporaryCoreBat -Force

        $env:BUILDX_BUILDER = $BuilderName
        $env:BUILDX_NO_DEFAULT_ATTESTATIONS = '1'
        $env:DOCKER_BUILDKIT = '1'

        Write-Section "Executando build e startup - tentativa $Attempt"
        Write-Host "Builder: $BuilderName"
        Write-Host "Log:     $attemptLog"

        $commandLine = "(echo.)|call `"$TemporaryCoreBat`" `"$Mode`""
        & $env:ComSpec /d /c $commandLine 2>&1 |
            Tee-Object -FilePath $attemptLog
        $exitCode = $LASTEXITCODE
    }
    finally {
        Remove-Item -LiteralPath $TemporaryCoreBat -Force -ErrorAction SilentlyContinue
        Restore-ProcessEnvironment 'BUILDX_BUILDER' $oldBuilder
        Restore-ProcessEnvironment 'BUILDX_NO_DEFAULT_ATTESTATIONS' $oldAttestations
        Restore-ProcessEnvironment 'DOCKER_BUILDKIT' $oldBuildKit
    }

    return [pscustomobject]@{
        ExitCode = $exitCode
        LogPath = $attemptLog
    }
}

if (-not (Test-Path -LiteralPath $CoreSourceBat)) {
    throw "Script core interno ausente: $CoreSourceBat"
}

$lockStream = $null
try {
    try {
        $lockStream = [IO.File]::Open(
            $LockPath,
            [IO.FileMode]::OpenOrCreate,
            [IO.FileAccess]::ReadWrite,
            [IO.FileShare]::None
        )
    }
    catch {
        throw 'Outro build da Contabilidade ja esta em execucao. Aguarde a finalizacao.'
    }

    Ensure-DockerAndBuildx
    Ensure-IsolatedBuilder

    $first = Invoke-CoreAttempt 1
    if ($first.ExitCode -eq 0) {
        Write-Ok 'Build e startup concluidos sem recuperacao de cache.'
        exit 0
    }

    $firstContent = if (Test-Path -LiteralPath $first.LogPath) {
        Get-Content -LiteralPath $first.LogPath -Raw
    }
    else {
        ''
    }

    if ($NoAutoRecovery -or -not (Test-BuildKitSnapshotCorruption $firstContent)) {
        Write-Host ''
        Write-Host 'A falha nao corresponde a corrupcao conhecida de snapshot do BuildKit.' -ForegroundColor Red
        Write-Host "Log: $($first.LogPath)" -ForegroundColor Yellow
        exit $first.ExitCode
    }

    Write-Warn 'Foi detectada inconsistencia interna de snapshot do BuildKit.'
    Write-Host 'A recuperacao sera automatica e restrita ao builder isolado da Contabilidade.'

    Remove-IsolatedBuilder
    Ensure-IsolatedBuilder

    $second = Invoke-CoreAttempt 2
    if ($second.ExitCode -eq 0) {
        Write-Ok 'Build e startup concluidos apos recriacao automatica do builder isolado.'
        exit 0
    }

    Write-Host ''
    Write-Host 'A segunda tentativa tambem falhou.' -ForegroundColor Red
    Write-Host "Primeiro log: $($first.LogPath)" -ForegroundColor Yellow
    Write-Host "Segundo log:  $($second.LogPath)" -ForegroundColor Yellow
    exit $second.ExitCode
}
finally {
    Remove-Item -LiteralPath $TemporaryCoreBat -Force -ErrorAction SilentlyContinue
    if ($null -ne $lockStream) {
        $lockStream.Dispose()
    }
}
