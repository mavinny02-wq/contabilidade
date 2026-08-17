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
$ArtifactBuildDir = Join-Path $ProjectDir '.docker-local\artifact-build'
$LockPath = Join-Path $ArtifactBuildDir 'buildkit-resilient.lock'
$BuildKitConfigPath = Join-Path $ArtifactBuildDir 'buildkitd.contabilidade.toml'
$BaseImagePreflightRoot = Join-Path $ArtifactBuildDir 'base-image-preflight'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$DockerModule = Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1'
$NativeProcessModule = Join-Path $PSScriptRoot 'lib\native-process.psm1'

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

function Ensure-DockerAndBuildx {
    Assert-ContabilidadeDockerAvailable
}

function Remove-IsolatedBuilder {
    Write-Warn "Removendo somente o builder isolado '$BuilderName' e o cache dele."
    Write-Host 'Volumes PostgreSQL, documentos, backups, containers e imagens da aplicacao nao serao removidos.'
    Invoke-ContabilidadeDocker -Arguments @('buildx', 'rm', '--force', $BuilderName) -AllowFailure | Out-Null
}

function Ensure-IsolatedBuilder {
    $configPath = $null
    if (Test-Path -LiteralPath $BuildKitConfigPath -PathType Leaf) {
        $configPath = $BuildKitConfigPath
    }
    Initialize-ContabilidadeBuilder -BuilderName $BuilderName -BuildKitConfigPath $configPath
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

function Write-PreflightLog {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Image,
        [Parameter(Mandatory = $true)]$Result
    )

    $entry = @(
        "===== BASE IMAGE: $Image ====="
        "EXIT_CODE: $($Result.ExitCode)"
        $Result.StdOut
        $Result.StdErr
        ''
    ) -join [Environment]::NewLine

    [IO.File]::AppendAllText(
        $Path,
        $entry,
        (New-Object Text.UTF8Encoding($false))
    )
}

function Invoke-BaseImagePreflight {
    param([int]$Attempt)

    $preflightLog = Join-Path $LogDir "BASE_IMAGES_${Timestamp}_tentativa${Attempt}.log"
    Remove-Item -LiteralPath $preflightLog -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $BaseImagePreflightRoot | Out-Null

    Write-Section "Validando e aquecendo imagens-base do runtime - tentativa $Attempt"
    Write-Host "Builder: $BuilderName"
    Write-Host "Log:     $preflightLog"

    $index = 0
    foreach ($image in @(Get-RuntimeBaseImages)) {
        $index += 1
        $contextDir = Join-Path $BaseImagePreflightRoot ("image-" + $index)
        if (Test-Path -LiteralPath $contextDir) {
            Remove-Item -LiteralPath $contextDir -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path $contextDir | Out-Null

        $dockerfilePath = Join-Path $contextDir 'Dockerfile'
        [IO.File]::WriteAllText(
            $dockerfilePath,
            "FROM $image" + [Environment]::NewLine,
            (New-Object Text.UTF8Encoding($false))
        )

        Write-Host "[INFO] Imagem-base: $image"
        $result = Invoke-ContabilidadeDocker -Arguments @(
            'buildx', 'build',
            '--builder', $BuilderName,
            '--pull=false',
            '--network=none',
            '--progress=plain',
            '--output', 'type=cacheonly',
            '--file', $dockerfilePath,
            $contextDir
        ) -AllowFailure

        Write-PreflightLog -Path $preflightLog -Image $image -Result $result
        if (-not $result.Success) {
            Write-Host "[FALHA] Nao foi possivel preparar a imagem-base '$image'." -ForegroundColor Red
            return [pscustomobject]@{
                Succeeded = $false
                ExitCode = $result.ExitCode
                LogPath = $preflightLog
                Output = $result.Output
                Image = $image
            }
        }
    }

    Write-Ok 'Imagens-base disponiveis no cache do builder.'
    return [pscustomobject]@{
        Succeeded = $true
        ExitCode = 0
        LogPath = $preflightLog
        Output = ''
        Image = $null
    }
}

function Test-WindowsHostDns {
    param([AllowNull()][string]$HostName)

    if ([string]::IsNullOrWhiteSpace($HostName)) {
        return $true
    }

    try {
        return @([Net.Dns]::GetHostAddresses($HostName)).Count -gt 0
    }
    catch {
        return $false
    }
}

function Repair-BuildKitDns {
    param([Parameter(Mandatory = $true)][string]$FailureContent)

    $failedServers = @(Get-ContabilidadeFailedDnsServers -Content $FailureContent)
    $registryHost = Get-ContabilidadeFailedRegistryHost -Content $FailureContent
    $explicitDns = [Environment]::GetEnvironmentVariable('CONTABILIDADE_BUILDKIT_DNS', 'Process')

    if ([string]::IsNullOrWhiteSpace($explicitDns) -and -not (Test-WindowsHostDns -HostName $registryHost)) {
        Write-Host ''
        Write-Host "O Windows tambem nao conseguiu resolver '$registryHost'." -ForegroundColor Red
        Write-Host 'Verifique conexao, VPN, proxy ou DNS do Windows e reinicie o Docker Desktop.' -ForegroundColor Yellow
        Write-Host 'Nenhuma configuracao do Docker Desktop foi alterada automaticamente.'
        return $false
    }

    try {
        $dnsServers = @(Get-ContabilidadeBuildKitDnsServers -RejectedServers $failedServers)
    }
    catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }

    if ($dnsServers.Count -eq 0) {
        Write-Host ''
        Write-Host 'Nao foi encontrado um DNS IPv4 alternativo seguro para o builder.' -ForegroundColor Red
        Write-Host 'Defina servidores aprovados antes de repetir, por exemplo:' -ForegroundColor Yellow
        Write-Host '  set CONTABILIDADE_BUILDKIT_DNS=<dns1>,<dns2>'
        Write-Host 'Depois execute novamente START_CONTABILIDADE.bat dev.'
        return $false
    }

    New-ContabilidadeBuildKitConfig -Path $BuildKitConfigPath -DnsServers $dnsServers | Out-Null

    Write-Warn 'Falha de DNS isolada no BuildKit detectada.'
    if ($failedServers.Count -gt 0) {
        Write-Host "DNS que falhou: $($failedServers -join ', ')"
    }
    Write-Host "DNS alternativo do builder: $($dnsServers -join ', ')"
    Write-Host "Config project-scoped: $BuildKitConfigPath"
    Write-Host 'A configuracao global do Docker Desktop nao sera modificada.'

    Remove-IsolatedBuilder
    Initialize-ContabilidadeBuilder -BuilderName $BuilderName -BuildKitConfigPath $BuildKitConfigPath
    return $true
}

function Show-RegistryFailureGuidance {
    param(
        [Parameter(Mandatory = $true)]$Result,
        [string]$Prefix = 'Falha ao acessar uma imagem-base'
    )

    Write-Host ''
    Write-Host "$Prefix." -ForegroundColor Red
    if (-not [string]::IsNullOrWhiteSpace($Result.Image)) {
        Write-Host "Imagem: $($Result.Image)"
    }
    Write-Host "Log: $($Result.LogPath)" -ForegroundColor Yellow
    Write-Host 'Verifique Docker Desktop, VPN, proxy, firewall e DNS.' -ForegroundColor Yellow
    Write-Host 'Para forcar DNS aprovados apenas no builder deste projeto:'
    Write-Host '  set CONTABILIDADE_BUILDKIT_DNS=<dns1>,<dns2>'
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

        $env:BUILDX_BUILDER = $BuilderName
        $env:BUILDX_NO_DEFAULT_ATTESTATIONS = '1'
        $env:DOCKER_BUILDKIT = '1'

        Write-Section "Executando build e startup - tentativa $Attempt"
        Write-Host "Builder: $BuilderName"
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

    # Fail fast before Maven/npm work. This buildx cache-only preflight resolves the
    # exact FROM images extracted from the canonical core script.
    $basePreflight = Invoke-BaseImagePreflight 1
    if (-not $basePreflight.Succeeded) {
        if ($NoAutoRecovery) {
            Show-RegistryFailureGuidance -Result $basePreflight
            exit $basePreflight.ExitCode
        }

        if (-not (Test-ContabilidadeBuildKitDnsFailure -Content $basePreflight.Output)) {
            Show-RegistryFailureGuidance -Result $basePreflight
            exit $basePreflight.ExitCode
        }

        if (-not (Repair-BuildKitDns -FailureContent $basePreflight.Output)) {
            Show-RegistryFailureGuidance -Result $basePreflight -Prefix 'Falha de DNS sem recuperacao automatica disponivel'
            exit $basePreflight.ExitCode
        }

        $basePreflight = Invoke-BaseImagePreflight 2
        if (-not $basePreflight.Succeeded) {
            Show-RegistryFailureGuidance -Result $basePreflight -Prefix 'A segunda tentativa de preparar as imagens-base tambem falhou'
            exit $basePreflight.ExitCode
        }
    }

    $first = Invoke-CoreAttempt 1
    if ($first.ExitCode -eq 0) {
        Write-Ok 'Build e startup concluidos sem recuperacao adicional.'
        exit 0
    }

    $firstContent = if (Test-Path -LiteralPath $first.LogPath) {
        Get-Content -LiteralPath $first.LogPath -Raw
    }
    else {
        ''
    }

    if ($NoAutoRecovery) {
        Write-Host ''
        Write-Host 'Recuperacao automatica desabilitada por -NoAutoRecovery.' -ForegroundColor Red
        Write-Host "Log: $($first.LogPath)" -ForegroundColor Yellow
        exit $first.ExitCode
    }

    $recoveryKind = $null
    if (Test-ContabilidadeBuildKitDnsFailure -Content $firstContent) {
        if (-not (Repair-BuildKitDns -FailureContent $firstContent)) {
            Write-Host "Log: $($first.LogPath)" -ForegroundColor Yellow
            exit $first.ExitCode
        }

        $latePreflight = Invoke-BaseImagePreflight 3
        if (-not $latePreflight.Succeeded) {
            Show-RegistryFailureGuidance -Result $latePreflight -Prefix 'A recuperacao DNS foi aplicada, mas o registry continua indisponivel'
            exit $latePreflight.ExitCode
        }
        $recoveryKind = 'DNS do BuildKit'
    }
    elseif (Test-BuildKitSnapshotCorruption $firstContent) {
        Write-Warn 'Foi detectada inconsistencia interna de snapshot do BuildKit.'
        Write-Host 'A recuperacao sera automatica e restrita ao builder isolado da Contabilidade.'

        Remove-IsolatedBuilder
        Ensure-IsolatedBuilder
        $recoveryKind = 'snapshot do BuildKit'
    }
    else {
        Write-Host ''
        Write-Host 'A falha nao corresponde a DNS do registry nem a corrupcao conhecida de snapshot do BuildKit.' -ForegroundColor Red
        Write-Host "Log: $($first.LogPath)" -ForegroundColor Yellow
        exit $first.ExitCode
    }

    $second = Invoke-CoreAttempt 2
    if ($second.ExitCode -eq 0) {
        Write-Ok "Build e startup concluidos apos recuperacao de $recoveryKind."
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
