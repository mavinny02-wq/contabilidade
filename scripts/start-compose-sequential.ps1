param(
    [ValidateSet('dev', 'onpremise')]
    [string]$Mode = 'dev',

    [string]$ComposeProjectName,

    [string]$EnvFilePath,

    [string[]]$AdditionalComposeFiles = @(),

    [string]$ProbeContainerName = 'contabilidade-startup-probe',

    [string]$FrontendHealthUrl = 'http://localhost:8088/healthz',

    [switch]$SkipDatabaseValidation,

    [switch]$NoExit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EnvFile = if ([string]::IsNullOrWhiteSpace($EnvFilePath)) {
    Join-Path $ProjectDir '.env'
}
else {
    $EnvFilePath
}
$ComposeBase = Join-Path $ProjectDir 'compose.yaml'
$ComposeOverride = Join-Path $ProjectDir '.docker-local\artifact-build\compose.local-artifacts.yaml'
$ComposeMode = if ($Mode -eq 'dev') {
    Join-Path $ProjectDir 'compose.dev.yaml'
}
else {
    Join-Path $ProjectDir 'compose.onpremise.yaml'
}

Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\startup-probe.psm1') -Force

function Write-Step {
    param([string]$Message)
    Write-Host ''
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Get-DotEnvValue {
    param([string]$Name, [string]$DefaultValue)

    $processValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($processValue)) {
        return $processValue.Trim()
    }

    if (Test-Path -LiteralPath $EnvFile) {
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
                if (-not [string]::IsNullOrWhiteSpace($value)) {
                    return $value
                }
            }
        }
    }

    return $DefaultValue
}

function Get-PositiveInt {
    param([string]$Name, [int]$DefaultValue)

    $raw = Get-DotEnvValue $Name ([string]$DefaultValue)
    $parsed = 0
    if (-not [int]::TryParse($raw, [ref]$parsed) -or $parsed -lt 1) {
        Write-Warn "$Name invalido ('$raw'); usando $DefaultValue."
        return $DefaultValue
    }
    return $parsed
}

$PollSeconds = Get-PositiveInt 'STARTUP_POLL_SECONDS' 3
$ServiceTimeoutSeconds = Get-PositiveInt 'SERVICE_STARTUP_TIMEOUT_SECONDS' 240
$KeycloakTimeoutSeconds = Get-PositiveInt 'KEYCLOAK_STARTUP_TIMEOUT_SECONDS' 600
$ReportEverySeconds = 15

$composePrefix = @('compose')
if (-not [string]::IsNullOrWhiteSpace($ComposeProjectName)) {
    $composePrefix += @('--project-name', $ComposeProjectName)
}
$composePrefix += @(
    '--env-file', $EnvFile,
    '-f', $ComposeBase,
    '-f', $ComposeMode,
    '-f', $ComposeOverride
)
foreach ($additionalFile in $AdditionalComposeFiles) {
    if (-not [string]::IsNullOrWhiteSpace($additionalFile)) {
        $composePrefix += @('-f', $additionalFile)
    }
}
$script:ComposePrefix = $composePrefix
$script:ProbeCleanupRequired = $false

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    return Invoke-ContabilidadeCompose `
        -ComposePrefix $script:ComposePrefix `
        -Arguments $Arguments `
        -AllowFailure:$AllowFailure `
        -Quiet:$Quiet
}

function Get-ServiceContainerId {
    param([string]$Service)

    $result = Invoke-Compose -Arguments @('ps', '-a', '-q', $Service) -AllowFailure -Quiet
    if (-not $result.Success) {
        $category = Get-ContabilidadeDockerFailureCategory -Content $result.Output
        throw "[$category] Nao foi possivel localizar o container do servico '$Service'. Exit code: $($result.ExitCode)."
    }

    $ids = @(
        $result.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    if ($ids.Count -eq 0) {
        return $null
    }
    return [string]$ids[0]
}

function Get-ContainerState {
    param([AllowNull()][string]$ContainerId)

    if ([string]::IsNullOrWhiteSpace($ContainerId)) {
        return [pscustomobject]@{ Status = 'missing'; Health = 'none'; ExitCode = $null }
    }

    $format = '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}|{{.State.ExitCode}}'
    $result = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'inspect', '--format', $format, $ContainerId) `
        -AllowFailure `
        -Quiet

    if (-not $result.Success) {
        if (Test-ContabilidadeDockerContainerAbsent -Content $result.Output) {
            return [pscustomobject]@{ Status = 'missing'; Health = 'none'; ExitCode = $null }
        }
        $category = Get-ContabilidadeDockerFailureCategory -Content $result.Output
        throw "[$category] Falha ao inspecionar container '$ContainerId'. Exit code: $($result.ExitCode)."
    }

    $line = @(
        $result.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    ) | Select-Object -First 1
    $parts = @($line -split '\|', 3)
    if ($parts.Count -lt 3) {
        throw "[DOCKER_PERMISSION_OR_API_FAILURE] Estado Docker invalido para '$ContainerId'."
    }

    $exitCode = 0
    [void][int]::TryParse($parts[2], [ref]$exitCode)
    return [pscustomobject]@{
        Status = $parts[0]
        Health = $parts[1]
        ExitCode = $exitCode
    }
}

function Show-ServiceLogs {
    param([string[]]$Services, [int]$Tail = 250)

    $arguments = @('logs', '--no-color', '--tail', [string]$Tail) + $Services
    $result = Invoke-Compose -Arguments $arguments -AllowFailure
    if (-not $result.Success) {
        Write-Warn "Nao foi possivel coletar todos os logs solicitados. Exit code: $($result.ExitCode)."
    }
}

function Wait-ServiceHealthy {
    param(
        [string]$Service,
        [int]$TimeoutSeconds,
        [string]$DisplayName
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $nextReport = Get-Date
    $lastSignature = ''

    while ((Get-Date) -lt $deadline) {
        $state = Get-ContainerState (Get-ServiceContainerId $Service)
        $signature = "$($state.Status)/$($state.Health)"

        if ($state.Status -eq 'running' -and ($state.Health -eq 'healthy' -or $state.Health -eq 'none')) {
            Write-Ok "$DisplayName pronto."
            return
        }

        if ($state.Status -eq 'exited' -or $state.Status -eq 'dead') {
            Show-ServiceLogs -Services @($Service)
            throw "$DisplayName encerrou antes de ficar pronto. Status=$($state.Status), exit=$($state.ExitCode)."
        }

        if ($signature -ne $lastSignature -or (Get-Date) -ge $nextReport) {
            $remaining = [Math]::Max(0, [int][Math]::Ceiling(($deadline - (Get-Date)).TotalSeconds))
            Write-Host "${DisplayName}: status=$($state.Status) health=$($state.Health) - limite restante ${remaining}s"
            $lastSignature = $signature
            $nextReport = (Get-Date).AddSeconds($ReportEverySeconds)
        }

        Start-Sleep -Seconds $PollSeconds
    }

    Show-ServiceLogs -Services @($Service)
    throw "Tempo esgotado aguardando $DisplayName apos ${TimeoutSeconds}s."
}

function Wait-OneShotSuccess {
    param(
        [string]$Service,
        [int]$TimeoutSeconds,
        [string]$DisplayName
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $state = Get-ContainerState (Get-ServiceContainerId $Service)
        if ($state.Status -eq 'exited') {
            if ($state.ExitCode -eq 0) {
                Write-Ok "$DisplayName concluido com exit code 0."
                return
            }
            Show-ServiceLogs -Services @($Service)
            throw "$DisplayName falhou com exit code $($state.ExitCode)."
        }
        if ($state.Status -eq 'dead') {
            Show-ServiceLogs -Services @($Service)
            throw "$DisplayName terminou em estado dead."
        }
        Start-Sleep -Seconds $PollSeconds
    }

    Show-ServiceLogs -Services @($Service)
    throw "Tempo esgotado aguardando $DisplayName."
}

function Remove-Probe {
    param([string]$Phase)

    $result = Remove-ContabilidadeStartupProbe -Name $ProbeContainerName
    Write-Host "[PROBE][$Phase] category=$($result.Category) exit=$($result.ExitCode) status=$($result.Status)"
    return $result
}

function Start-Probe {
    $null = Remove-Probe -Phase 'before-create'
    Write-Step '[PROBE] Iniciando sonda unica de readiness na rede Compose...'
    $result = Start-ContabilidadeStartupProbe `
        -ComposePrefix $script:ComposePrefix `
        -Name $ProbeContainerName
    Write-Ok "Sonda pronta: $ProbeContainerName ($($result.ContainerId))."
}

function Wait-ProbeUrl {
    param(
        [string]$Url,
        [int]$TimeoutSeconds,
        [string]$Description,
        [string]$ServiceForLogs
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $nextReport = Get-Date

    while ((Get-Date) -lt $deadline) {
        $request = Invoke-ContabilidadeStartupProbeRequest `
            -Name $ProbeContainerName `
            -Url $Url `
            -TimeoutSeconds 5
        if ($request.Success) {
            Write-Ok $Description
            return
        }

        if (-not [string]::IsNullOrWhiteSpace($ServiceForLogs)) {
            $state = Get-ContainerState (Get-ServiceContainerId $ServiceForLogs)
            if ($state.Status -eq 'exited' -or $state.Status -eq 'dead') {
                Show-ServiceLogs -Services @($ServiceForLogs)
                throw "$ServiceForLogs encerrou antes de responder readiness."
            }
        }

        if ((Get-Date) -ge $nextReport) {
            Write-Host "$Description ainda indisponivel... category=$($request.Category) exit=$($request.ExitCode)"
            $nextReport = (Get-Date).AddSeconds($ReportEverySeconds)
        }
        Start-Sleep -Seconds $PollSeconds
    }

    if (-not [string]::IsNullOrWhiteSpace($ServiceForLogs)) {
        Show-ServiceLogs -Services @($ServiceForLogs)
    }
    throw "Tempo esgotado aguardando: $Description"
}

function Wait-WorkerHealth {
    $deadline = (Get-Date).AddSeconds($ServiceTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $result = Invoke-Compose -Arguments @(
            'exec', '-T', 'automation-worker',
            'node', '-e',
            "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        ) -AllowFailure -Quiet
        if ($result.Success) {
            Write-Ok 'Automation worker saudavel.'
            return
        }

        $state = Get-ContainerState (Get-ServiceContainerId 'automation-worker')
        if ($state.Status -eq 'exited' -or $state.Status -eq 'dead') {
            Show-ServiceLogs -Services @('automation-worker')
            throw 'Automation worker encerrou durante a inicializacao.'
        }
        Start-Sleep -Seconds $PollSeconds
    }

    Show-ServiceLogs -Services @('automation-worker')
    throw 'Tempo esgotado aguardando o automation worker.'
}

function Wait-FrontendHealth {
    $deadline = (Get-Date).AddSeconds($ServiceTimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $FrontendHealthUrl
            if ($response.StatusCode -eq 200) {
                Write-Ok "Frontend saudavel em $FrontendHealthUrl."
                return
            }
        }
        catch {
            # Continua aguardando; o estado do container abaixo define falha terminal.
        }

        $state = Get-ContainerState (Get-ServiceContainerId 'frontend')
        if ($state.Status -eq 'exited' -or $state.Status -eq 'dead') {
            Show-ServiceLogs -Services @('frontend')
            throw 'Frontend encerrou durante a inicializacao.'
        }
        Start-Sleep -Seconds $PollSeconds
    }

    Show-ServiceLogs -Services @('frontend')
    throw 'Tempo esgotado aguardando o frontend.'
}

function Remove-DevAuthContainers {
    Write-Step '[DEV] Mantendo somente os servicos necessarios...'
    $stop = Invoke-Compose -Arguments @('stop', 'keycloak', 'postgres-bootstrap') -AllowFailure -Quiet
    if (-not $stop.Success -and -not (Test-ContabilidadeDockerContainerAbsent -Content $stop.Output)) {
        $category = Get-ContabilidadeDockerFailureCategory -Content $stop.Output
        throw "[$category] Falha ao parar servicos de autenticacao omitidos no modo dev. Exit code: $($stop.ExitCode)."
    }

    $remove = Invoke-Compose -Arguments @('rm', '-f', '-s', 'keycloak', 'postgres-bootstrap') -AllowFailure -Quiet
    if (-not $remove.Success -and -not (Test-ContabilidadeDockerContainerAbsent -Content $remove.Output)) {
        $category = Get-ContabilidadeDockerFailureCategory -Content $remove.Output
        throw "[$category] Falha ao remover containers de autenticacao omitidos no modo dev. Exit code: $($remove.ExitCode)."
    }
    Write-Ok 'Keycloak e bootstrap omitidos: APP_SECURITY_ENABLED=false no modo dev.'
}

function Validate-DatabaseSchemas {
    if ($SkipDatabaseValidation) {
        if ([string]::IsNullOrWhiteSpace($ComposeProjectName) -or
            $ComposeProjectName -notmatch '^contabilidade-startup-it-[a-z0-9-]+$') {
            throw 'SkipDatabaseValidation so e permitido em projeto efemero contabilidade-startup-it-*.'
        }
        Write-Warn 'Validacao BAT do banco omitida somente no harness efemero; o harness validara Flyway diretamente.'
        return
    }

    Write-Step '[VALIDATE] Validando banco e migrations...'
    $validationBat = Join-Path $PSScriptRoot 'validate-database-state.bat'
    $commandLine = 'call "' + $validationBat + '" "' + $Mode + '"'
    $result = Invoke-ContabilidadeNativeCommand `
        -FilePath $env:ComSpec `
        -Arguments @('/d', '/c', $commandLine)
    Write-ContabilidadeNativeOutput -Result $result

    if (-not $result.Success) {
        if ($Mode -eq 'dev') {
            Show-ServiceLogs -Services @('postgres', 'backend') -Tail 200
        }
        else {
            Show-ServiceLogs -Services @('postgres', 'postgres-bootstrap', 'keycloak', 'backend') -Tail 200
        }
        throw "Validacao dos schemas PostgreSQL falhou. Exit code: $($result.ExitCode)."
    }
}

function Invoke-SequentialStartup {
    foreach ($required in (@($EnvFile, $ComposeBase, $ComposeMode, $ComposeOverride) + $AdditionalComposeFiles)) {
        if (-not (Test-Path -LiteralPath $required)) {
            throw "Arquivo obrigatorio ausente: $required"
        }
    }

    Assert-ContabilidadeDockerAvailable
    $script:ProbeCleanupRequired = $true
    $null = Remove-Probe -Phase 'initial'

    $config = Invoke-Compose -Arguments @('config', '--quiet') -AllowFailure -Quiet
    if (-not $config.Success) {
        throw "Configuracao Compose invalida. Exit code: $($config.ExitCode)."
    }

    if ($Mode -eq 'dev') {
        Remove-DevAuthContainers
    }

    Write-Step '[START 1] PostgreSQL...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', 'postgres')
    Wait-ServiceHealthy -Service 'postgres' -TimeoutSeconds $ServiceTimeoutSeconds -DisplayName 'PostgreSQL'

    if ($Mode -eq 'onpremise') {
        Write-Step '[START 2] Bootstrap do banco Keycloak...'
        $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', 'postgres-bootstrap')
        Wait-OneShotSuccess -Service 'postgres-bootstrap' -TimeoutSeconds $ServiceTimeoutSeconds -DisplayName 'Bootstrap PostgreSQL/Keycloak'

        Write-Step '[START 3] Keycloak...'
        $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', 'keycloak')
        Wait-ServiceHealthy -Service 'keycloak' -TimeoutSeconds $KeycloakTimeoutSeconds -DisplayName 'Keycloak'
    }
    else {
        Write-Host '[SKIP] Bootstrap e Keycloak nao sao necessarios no modo dev.' -ForegroundColor DarkGray
    }

    Start-Probe

    Write-Step '[START] Backend...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', '--force-recreate', 'backend')
    Wait-ProbeUrl `
        -Url 'http://backend:8080/actuator/health/readiness' `
        -TimeoutSeconds $ServiceTimeoutSeconds `
        -Description 'Backend readiness' `
        -ServiceForLogs 'backend'
    $null = Remove-Probe -Phase 'after-backend-readiness'

    Validate-DatabaseSchemas

    Write-Step '[START] Automation worker...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', '--force-recreate', 'automation-worker')
    Wait-WorkerHealth

    Write-Step '[START] Frontend...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', '--force-recreate', 'frontend')
    Wait-FrontendHealth

    $null = Invoke-Compose -Arguments @('exec', '-T', 'frontend', 'nginx', '-t')

    $state = Invoke-Compose -Arguments @('ps', '-a') -AllowFailure -Quiet
    if (-not $state.Success) {
        throw "Nao foi possivel exibir o estado final da stack. Exit code: $($state.ExitCode)."
    }
    if (-not [string]::IsNullOrWhiteSpace($state.StdOut)) {
        Write-Host ''
        Write-Host $state.StdOut.TrimEnd()
    }

    return [pscustomobject]@{
        Mode = $Mode
        ApplicationUrl = $FrontendHealthUrl -replace '/healthz$', ''
        ComposeProjectName = $ComposeProjectName
    }
}

Set-Location $ProjectDir

try {
    $outcome = Invoke-ContabilidadeWithProbeCleanup `
        -Operation { Invoke-SequentialStartup } `
        -Cleanup {
            if ($script:ProbeCleanupRequired) {
                return Remove-Probe -Phase 'finally'
            }
            return [pscustomobject]@{
                Category = 'CLEANUP_NOT_REQUIRED'
                ExitCode = 0
                Status = 'not-entered'
            }
        }

    $summary = $outcome.Result
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host 'STACK PRONTA' -ForegroundColor Green
    Write-Host "Modo:       $($summary.Mode)"
    Write-Host "Aplicacao:  $($summary.ApplicationUrl)"
    if ($Mode -eq 'dev') {
        Write-Host 'Servicos:   PostgreSQL, backend, worker e frontend'
        Write-Host 'Autenticacao: desabilitada; Keycloak nao foi iniciado'
    }
    else {
        Write-Host 'Servicos:   PostgreSQL, bootstrap, Keycloak, backend, worker e frontend'
    }
    Write-Host '============================================================' -ForegroundColor Green

    if ($NoExit) {
        return $summary
    }
    exit 0
}
catch {
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host 'STARTUP SEQUENCIAL FALHOU' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host '============================================================' -ForegroundColor Red

    if ($NoExit) {
        throw
    }
    exit 1
}
