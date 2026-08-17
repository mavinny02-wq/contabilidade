param(
    [ValidateSet('dev')]
    [string]$Mode = 'dev',

    [switch]$NoSnapshotRecovery
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$CoreSourceBat = Join-Path $PSScriptRoot 'start-contabilidade-core.bat'
$TemporaryCoreBat = Join-Path $ProjectDir '.START_CONTABILIDADE_CORE.runtime.bat'
$LogDir = Join-Path $ProjectDir '.docker-local\logs'
$ArtifactBuildDir = Join-Path $ProjectDir '.docker-local\artifact-build'
$LockPath = Join-Path $ArtifactBuildDir 'docker-build-resilient.lock'
$LegacyBuildKitConfigPath = Join-Path $ArtifactBuildDir 'buildkitd.contabilidade.toml'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$DockerModule = Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1'
$NativeProcessModule = Join-Path $PSScriptRoot 'lib\native-process.psm1'
$NetworkDiagnosticsScript = Join-Path $PSScriptRoot 'diagnostics\capture-docker-network-diagnostics.ps1'

Import-Module $DockerModule -Force
Import-Module $NativeProcessModule -Force

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

function Restore-ProcessEnvironment {
    param([string]$Name, [AllowNull()][string]$Value)

    if ($null -eq $Value) {
        [Environment]::SetEnvironmentVariable($Name, $null, 'Process')
    }
    else {
        [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    }
}

function Test-BuildKitSnapshotCorruption {
    param([string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(failed to prepare extraction snapshot|parent snapshot\s+sha256:[a-f0-9]+\s+does not exist|snapshot[^\r\n]*(does not exist|not found)|failed to get layer[^\r\n]*(not found|does not exist))'
}

function Get-RuntimeBaseImages {
    $content = Get-Content -LiteralPath $CoreSourceBat -Raw
    $images = @()

    foreach ($match in [regex]::Matches($content, '(?im)^\s*echo\s+FROM\s+([^\s]+)\s*$')) {
        $image = $match.Groups[1].Value.Trim()
        if (-not [string]::IsNullOrWhiteSpace($image) -and $images -notcontains $image) {
            $images += $image
        }
    }

    if ($images.Count -eq 0) {
        throw "Nenhuma imagem-base foi encontrada em $CoreSourceBat."
    }
    return $images
}

function Invoke-DaemonBaseImagePreflight {
    $logPath = Join-Path $LogDir "BASE_IMAGES_DAEMON_${Timestamp}.log"
    Remove-Item -LiteralPath $logPath -Force -ErrorAction SilentlyContinue

    Write-Section 'Validando imagens-base pelo Docker daemon (modelo PRIMA)'
    Write-Host "Log: $logPath"

    foreach ($image in @(Get-RuntimeBaseImages)) {
        Write-Host "[INFO] Imagem-base: $image"
        $inspect = Invoke-ContabilidadeDocker -Arguments @('image', 'inspect', $image) -AllowFailure -Quiet
        if ($inspect.Success) {
            [IO.File]::AppendAllText(
                $logPath,
                "CACHED $image" + [Environment]::NewLine,
                (New-Object Text.UTF8Encoding($false))
            )
            continue
        }

        # PRIMA authority: registry access is performed by the Docker daemon/default
        # builder. The project never writes a buildkitd DNS file or guesses resolvers.
        $pull = Invoke-ContabilidadeDocker -Arguments @('pull', $image) -AllowFailure
        $entry = @(
            "===== BASE IMAGE: $image ====="
            "EXIT_CODE: $($pull.ExitCode)"
            $pull.StdOut
            $pull.StdErr
            ''
        ) -join [Environment]::NewLine
        [IO.File]::AppendAllText($logPath, $entry, (New-Object Text.UTF8Encoding($false)))

        if (-not $pull.Success) {
            return [pscustomobject]@{
                Succeeded = $false
                ExitCode = $pull.ExitCode
                LogPath = $logPath
                Output = $pull.Output
                Image = $image
            }
        }
    }

    Write-Ok 'Imagens-base disponiveis no image store do Docker daemon.'
    return [pscustomobject]@{
        Succeeded = $true
        ExitCode = 0
        LogPath = $logPath
        Output = ''
        Image = $null
    }
}

function Invoke-PrimaNetworkDiagnostics {
    $diagnosticLog = Join-Path $LogDir "DOCKER_NETWORK_${Timestamp}.log"
    if (-not (Test-Path -LiteralPath $NetworkDiagnosticsScript -PathType Leaf)) {
        Write-Warn "Script de diagnostico ausente: $NetworkDiagnosticsScript"
        return $null
    }

    try {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $NetworkDiagnosticsScript -OutputPath $diagnosticLog
    }
    catch {
        Write-Warn "Diagnostico Docker nao concluiu: $($_.Exception.Message)"
    }
    return $diagnosticLog
}

function Show-PrimaDnsGuidance {
    param(
        [Parameter(Mandatory = $true)][string]$FailureContent,
        [Parameter(Mandatory = $true)][string]$FailureLog
    )

    $hostName = Get-ContabilidadeFailedRegistryHost -Content $FailureContent
    $diagnosticLog = Invoke-PrimaNetworkDiagnostics

    Write-Host ''
    Write-Host 'Falha de DNS da rede de build do Docker.' -ForegroundColor Red
    if (-not [string]::IsNullOrWhiteSpace($hostName)) {
        Write-Host "Host que nao resolveu: $hostName"
    }
    Write-Host "Log da falha: $FailureLog" -ForegroundColor Yellow
    if (-not [string]::IsNullOrWhiteSpace($diagnosticLog)) {
        Write-Host "Diagnostico host/container/BuildKit: $diagnosticLog" -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host 'Aplicando exatamente o limite operacional usado no PRIMA:' -ForegroundColor Cyan
    Write-Host '1. O repositorio nao escolhe DNS, nao grava [dns] em buildkitd.toml e nao altera o Windows.'
    Write-Host '2. Abra Docker Desktop > Settings > Docker Engine.'
    Write-Host '3. Preserve o JSON existente e configure "dns" com o DNS aprovado da sua rede/VPN.'
    Write-Host '4. Clique Apply & Restart e repita START_CONTABILIDADE.bat dev.'
    Write-Host '5. Se a rede usa proxy, configure-o no Docker Desktop/daemon; mantenha credenciais fora do repositorio.'
    Write-Host ''
    Write-Host 'Exemplo apenas de formato; substitua pelo DNS autorizado da sua rede:' -ForegroundColor Yellow
    Write-Host '  { "dns": ["DNS_DA_REDE_OU_VPN"] }'
    Write-Host ''
    Write-Host 'Nenhum DNS publico ou especifico de workstation e imposto pelo projeto.'
}

function Invoke-CoreAttempt {
    param([int]$Attempt)

    $attemptLog = Join-Path $LogDir "START_CONTABILIDADE_RESILIENTE_${Timestamp}_tentativa${Attempt}.log"
    $oldBuilder = [Environment]::GetEnvironmentVariable('BUILDX_BUILDER', 'Process')
    $oldAttestations = [Environment]::GetEnvironmentVariable('BUILDX_NO_DEFAULT_ATTESTATIONS', 'Process')
    $oldBuildKit = [Environment]::GetEnvironmentVariable('DOCKER_BUILDKIT', 'Process')
    $exitCode = 1

    try {
        Copy-Item -LiteralPath $CoreSourceBat -Destination $TemporaryCoreBat -Force

        # Explicitly undo the project-specific builder used by the superseded fix.
        $env:BUILDX_BUILDER = 'default'
        $env:BUILDX_NO_DEFAULT_ATTESTATIONS = '1'
        $env:DOCKER_BUILDKIT = '1'

        Write-Section "Executando build e startup - tentativa $Attempt"
        Write-Host 'Builder: default (Docker Desktop/daemon)'
        Write-Host "Log:     $attemptLog"

        $commandLine = "(echo.)|call `"$TemporaryCoreBat`" `"$Mode`""
        $nativeResult = Invoke-CmdCommand -CommandLine $commandLine -LogPath $attemptLog
        $exitCode = $nativeResult.ExitCode
        if (-not $nativeResult.Succeeded) {
            Write-Host "[FALHA] Tentativa $Attempt terminou com exit code $exitCode. Consulte: $attemptLog" -ForegroundColor Red
        }
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

if (-not (Test-Path -LiteralPath $CoreSourceBat -PathType Leaf)) {
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

    Assert-ContabilidadeDockerAvailable
    Use-ContabilidadeDefaultBuilder
    Remove-ContabilidadeLegacyIsolatedBuilder

    # Remove only the stale project-local DNS file produced by the superseded
    # implementation. Docker Desktop/daemon remains the sole DNS authority.
    Remove-Item -LiteralPath $LegacyBuildKitConfigPath -Force -ErrorAction SilentlyContinue

    $basePreflight = Invoke-DaemonBaseImagePreflight
    if (-not $basePreflight.Succeeded) {
        if (Test-ContabilidadeDockerDnsFailure -Content $basePreflight.Output) {
            Show-PrimaDnsGuidance -FailureContent $basePreflight.Output -FailureLog $basePreflight.LogPath
        }
        else {
            Write-Host ''
            Write-Host "Falha ao obter a imagem-base '$($basePreflight.Image)' pelo Docker daemon." -ForegroundColor Red
            Write-Host "Log: $($basePreflight.LogPath)" -ForegroundColor Yellow
            Write-Host 'Verifique registry, autenticacao, proxy, firewall e disponibilidade da imagem.'
        }
        exit $basePreflight.ExitCode
    }

    $first = Invoke-CoreAttempt 1
    if ($first.ExitCode -eq 0) {
        Write-Ok 'Build e startup concluidos pelo builder default.'
        exit 0
    }

    $firstContent = if (Test-Path -LiteralPath $first.LogPath) {
        Get-Content -LiteralPath $first.LogPath -Raw
    }
    else {
        ''
    }

    if (Test-ContabilidadeDockerDnsFailure -Content $firstContent) {
        Show-PrimaDnsGuidance -FailureContent $firstContent -FailureLog $first.LogPath
        exit $first.ExitCode
    }

    if (-not $NoSnapshotRecovery -and (Test-BuildKitSnapshotCorruption -Content $firstContent)) {
        Write-Warn 'Foi detectada a assinatura de corrupcao de snapshot tratada pelo PRIMA.'
        Write-Host 'Somente cache de build nao utilizado sera limpo; volumes, containers e dados nao serao removidos.'
        $prune = Invoke-ContabilidadeDocker -Arguments @('builder', 'prune', '--force') -AllowFailure
        if ($prune.Success) {
            $second = Invoke-CoreAttempt 2
            if ($second.ExitCode -eq 0) {
                Write-Ok 'Build e startup concluidos apos a unica repeticao de snapshot.'
                exit 0
            }
            Write-Host ''
            Write-Host 'A segunda tentativa tambem falhou.' -ForegroundColor Red
            Write-Host "Primeiro log: $($first.LogPath)" -ForegroundColor Yellow
            Write-Host "Segundo log:  $($second.LogPath)" -ForegroundColor Yellow
            exit $second.ExitCode
        }
    }

    Write-Host ''
    Write-Host 'A falha nao corresponde a DNS nem a corrupcao conhecida de snapshot do BuildKit.' -ForegroundColor Red
    Write-Host "Log: $($first.LogPath)" -ForegroundColor Yellow
    exit $first.ExitCode
}
finally {
    Remove-Item -LiteralPath $TemporaryCoreBat -Force -ErrorAction SilentlyContinue
    if ($null -ne $lockStream) {
        $lockStream.Dispose()
    }
}
