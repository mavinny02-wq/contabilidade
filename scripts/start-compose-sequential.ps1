param(
    [ValidateSet('dev', 'onpremise')]
    [string]$Mode = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$EnvFile = Join-Path $ProjectDir '.env'
$ComposeBase = Join-Path $ProjectDir 'compose.yaml'
$ComposeOverride = Join-Path $ProjectDir '.docker-local\artifact-build\compose.local-artifacts.yaml'
$ComposeMode = if ($Mode -eq 'dev') {
    Join-Path $ProjectDir 'compose.dev.yaml'
}
else {
    Join-Path $ProjectDir 'compose.onpremise.yaml'
}
$ProbeContainer = 'contabilidade-startup-probe'

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

$script:ComposePrefix = @(
    'compose',
    '--env-file', $EnvFile,
    '-f', $ComposeBase,
    '-f', $ComposeMode,
    '-f', $ComposeOverride
)

function Invoke-Docker {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    if ($Quiet) {
        & docker @Arguments *> $null
    }
    else {
        & docker @Arguments
    }

    $exitCode = $LASTEXITCODE
    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "Docker falhou: docker $($Arguments -join ' '). Exit code: $exitCode."
    }
    return $exitCode
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    $full = @($script:ComposePrefix + $Arguments)
    $exitCode = Invoke-Docker -Arguments $full -AllowFailure:$AllowFailure -Quiet:$Quiet
    return $exitCode
}

function Get-ServiceContainerId {
    param([string]$Service)

    $prefix = $script:ComposePrefix
    $arguments = @('ps', '-a', '-q', $Service)
    $output = (& docker @prefix @arguments 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($output)) {
        return $null
    }
    return ($output -split "`r?`n")[0].Trim()
}

function Get-ContainerState {
    param([AllowNull()][string]$ContainerId)

    if ([string]::IsNullOrWhiteSpace($ContainerId)) {
        return [pscustomobject]@{ Status = 'missing'; Health = 'none'; ExitCode = $null }
    }

    $status = (& docker inspect --format '{{.State.Status}}' $ContainerId 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        return [pscustomobject]@{ Status = 'missing'; Health = 'none'; ExitCode = $null }
    }

    $health = (& docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $ContainerId 2>$null | Out-String).Trim()
    $exitText = (& docker inspect --format '{{.State.ExitCode}}' $ContainerId 2>$null | Out-String).Trim()
    $exitCode = 0
    [void][int]::TryParse($exitText, [ref]$exitCode)

    return [pscustomobject]@{
        Status = $status
        Health = $health
        ExitCode = $exitCode
    }
}

function Show-ServiceLogs {
    param([string[]]$Services, [int]$Tail = 250)

    $arguments = @('logs', '--no-color', '--tail', [string]$Tail) + $Services
    $null = Invoke-Compose -Arguments $arguments -AllowFailure
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
    $null = Invoke-Docker -Arguments @('rm', '-f', $ProbeContainer) -AllowFailure -Quiet
}

function Start-Probe {
    Remove-Probe
    Write-Step '[PROBE] Iniciando sonda unica de readiness na rede Compose...'
    $null = Invoke-Compose -Arguments @(
        'run', '--no-deps', '-d',
        '--name', $ProbeContainer,
        '--entrypoint', '/bin/sh',
        'frontend',
        '-c', 'while :; do sleep 3600; done'
    ) -Quiet

    $state = (& docker inspect --format '{{.State.Status}}' $ProbeContainer 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $state -ne 'running') {
        throw "A sonda $ProbeContainer nao permaneceu em execucao. Status=$state"
    }
    Write-Ok "Sonda pronta: $ProbeContainer"
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
        & docker exec $ProbeContainer wget -q -T 5 -O - $Url *> $null
        if ($LASTEXITCODE -eq 0) {
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
            Write-Host "$Description ainda indisponivel..."
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
        $exitCode = Invoke-Compose -Arguments @(
            'exec', '-T', 'automation-worker',
            'node', '-e',
            "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        ) -AllowFailure -Quiet
        if ($exitCode -eq 0) {
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
            $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:8088/healthz'
            if ($response.StatusCode -eq 200) {
                Write-Ok 'Frontend saudavel em http://localhost:8088/healthz.'
                return
            }
        }
        catch {
            # Continua aguardando.
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
    $null = Invoke-Compose -Arguments @('stop', 'keycloak', 'postgres-bootstrap') -AllowFailure -Quiet
    $null = Invoke-Compose -Arguments @('rm', '-f', '-s', 'keycloak', 'postgres-bootstrap') -AllowFailure -Quiet
    Write-Ok 'Keycloak e bootstrap omitidos: APP_SECURITY_ENABLED=false no modo dev.'
}

function Validate-DatabaseSchemas {
    Write-Step '[VALIDATE] Validando banco e migrations...'
    $validationBat = Join-Path $PSScriptRoot 'validate-database-state.bat'
    & $env:ComSpec /d /c "call `"$validationBat`" `"$Mode`""
    if ($LASTEXITCODE -ne 0) {
        if ($Mode -eq 'dev') {
            Show-ServiceLogs -Services @('postgres', 'backend') -Tail 200
        }
        else {
            Show-ServiceLogs -Services @('postgres', 'postgres-bootstrap', 'keycloak', 'backend') -Tail 200
        }
        throw 'Validacao dos schemas PostgreSQL falhou.'
    }
}

foreach ($required in @($EnvFile, $ComposeBase, $ComposeMode, $ComposeOverride)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Arquivo obrigatorio ausente: $required"
    }
}

Set-Location $ProjectDir
Remove-Probe

try {
    $null = Invoke-Compose -Arguments @('config', '--quiet')

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
    Wait-ProbeUrl -Url 'http://backend:8080/actuator/health/readiness' -TimeoutSeconds $ServiceTimeoutSeconds -Description 'Backend readiness' -ServiceForLogs 'backend'
    Remove-Probe

    Validate-DatabaseSchemas

    Write-Step '[START] Automation worker...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', '--force-recreate', 'automation-worker')
    Wait-WorkerHealth

    Write-Step '[START] Frontend...'
    $null = Invoke-Compose -Arguments @('up', '--no-build', '--no-deps', '-d', '--force-recreate', 'frontend')
    Wait-FrontendHealth

    $null = Invoke-Compose -Arguments @('exec', '-T', 'frontend', 'nginx', '-t')

    Write-Host ''
    $prefix = $script:ComposePrefix
    & docker @prefix ps -a
    if ($LASTEXITCODE -ne 0) {
        throw 'Nao foi possivel exibir o estado final da stack.'
    }

    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host 'STACK PRONTA' -ForegroundColor Green
    Write-Host "Modo:       $Mode"
    Write-Host 'Aplicacao:  http://localhost:8088'
    if ($Mode -eq 'dev') {
        Write-Host 'Servicos:   PostgreSQL, backend, worker e frontend'
        Write-Host 'Autenticacao: desabilitada; Keycloak nao foi iniciado'
    }
    else {
        Write-Host 'Servicos:   PostgreSQL, bootstrap, Keycloak, backend, worker e frontend'
    }
    Write-Host '============================================================' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host 'STARTUP SEQUENCIAL FALHOU' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host '============================================================' -ForegroundColor Red
    exit 1
}
finally {
    Remove-Probe
}
