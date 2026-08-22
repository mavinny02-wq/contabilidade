param(
    [ValidateSet('dev', 'onpremise')]
    [string]$Mode = 'dev',

    [string]$ComposeProjectName,

    [string]$EnvFilePath,

    [string[]]$AdditionalComposeFiles = @(),

    # Retained for backward-compatible harness invocation. The PRIMA-style
    # startup no longer creates a readiness probe container.
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

Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force -ErrorAction Stop

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

    if (Test-Path -LiteralPath $EnvFile -PathType Leaf) {
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

    $raw = Get-DotEnvValue -Name $Name -DefaultValue ([string]$DefaultValue)
    $parsed = 0
    if (-not [int]::TryParse($raw, [ref]$parsed) -or $parsed -lt 1) {
        Write-Warn "$Name invalido ('$raw'); usando $DefaultValue."
        return $DefaultValue
    }
    return $parsed
}

$ComposeWaitTimeoutSeconds = Get-PositiveInt -Name 'COMPOSE_STARTUP_WAIT_TIMEOUT_SECONDS' -DefaultValue 720
$ServiceTimeoutSeconds = Get-PositiveInt -Name 'SERVICE_STARTUP_TIMEOUT_SECONDS' -DefaultValue 240
$PollSeconds = Get-PositiveInt -Name 'STARTUP_POLL_SECONDS' -DefaultValue 3

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

function Get-CommandDiagnostic {
    param([Parameter(Mandatory = $true)]$Result)

    $parts = @(
        [string]$Result.StdErr
        [string]$Result.StdOut
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    if ($parts.Count -eq 0) {
        return 'sem stdout/stderr'
    }

    $detail = ($parts -join [Environment]::NewLine).Trim()
    $detail = [regex]::Replace(
        $detail,
        '(?i)\b(password|passwd|token|secret|client_secret)\s*[:=]\s*[^\s;]+',
        '$1=[REDACTED]'
    )
    $detail = [regex]::Replace(
        $detail,
        '(?i)(https?://)[^\s/@:]+:[^\s/@]+@',
        '$1[REDACTED]@'
    )
    if ($detail.Length -gt 1600) {
        return $detail.Substring(0, 1600) + '...'
    }
    return $detail
}

function Show-ComposeEvidence {
    Write-Host ''
    Write-Host '---- ESTADO DA STACK ----' -ForegroundColor Yellow
    $null = Invoke-Compose -Arguments @('ps', '-a') -AllowFailure

    Write-Host ''
    Write-Host '---- LOGS DA STACK (ULTIMAS 250 LINHAS) ----' -ForegroundColor Yellow
    $null = Invoke-Compose -Arguments @(
        'logs', '--no-color', '--tail', '250',
        'postgres', 'postgres-bootstrap', 'keycloak',
        'backend', 'automation-worker', 'frontend'
    ) -AllowFailure
}

function Assert-ComposeServices {
    $servicesResult = Invoke-Compose -Arguments @('config', '--services') -AllowFailure -Quiet
    if (-not $servicesResult.Success) {
        throw "Configuracao Compose invalida. Exit code: $($servicesResult.ExitCode). $(Get-CommandDiagnostic -Result $servicesResult)"
    }

    $services = @(
        $servicesResult.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    foreach ($requiredService in @(
        'postgres',
        'postgres-bootstrap',
        'keycloak',
        'backend',
        'automation-worker',
        'frontend'
    )) {
        if ($services -notcontains $requiredService) {
            throw "Servico obrigatorio ausente do Compose efetivo: $requiredService"
        }
    }
}

function Wait-ComposeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Description,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [int]$TimeoutSeconds = $ServiceTimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastResult = $null
    while ((Get-Date) -lt $deadline) {
        $lastResult = Invoke-Compose -Arguments $Arguments -AllowFailure -Quiet
        if ($lastResult.Success) {
            Write-Ok $Description
            return
        }
        Start-Sleep -Seconds $PollSeconds
    }

    $detail = if ($null -eq $lastResult) {
        'comando nao executado'
    }
    else {
        Get-CommandDiagnostic -Result $lastResult
    }
    throw "Tempo esgotado aguardando $Description. $detail"
}

function Wait-Http200 {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][string]$Description,
        [int]$TimeoutSeconds = $ServiceTimeoutSeconds
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastError = ''
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 -Uri $Url
            if ($response.StatusCode -eq 200) {
                Write-Ok "$Description ($Url)"
                return $response
            }
            $lastError = "HTTP $($response.StatusCode)"
        }
        catch {
            $lastError = $_.Exception.Message
        }
        Start-Sleep -Seconds $PollSeconds
    }

    throw "Tempo esgotado aguardando $Description em '$Url'. Ultimo erro: $lastError"
}

function Validate-DatabaseSchemas {
    if ($SkipDatabaseValidation) {
        if ([string]::IsNullOrWhiteSpace($ComposeProjectName) -or
            $ComposeProjectName -notmatch '^contabilidade-startup-it-[a-z0-9-]+$') {
            throw 'SkipDatabaseValidation so e permitido em projeto efemero contabilidade-startup-it-*'
        }
        Write-Warn 'Validacao BAT do banco omitida somente no harness efemero.'
        return
    }

    Write-Step '[VALIDATE] Validando schemas PostgreSQL, Keycloak e Flyway...'
    $validationBat = Join-Path $PSScriptRoot 'validate-database-state.bat'
    $commandLine = 'call "' + $validationBat + '" "' + $Mode + '"'
    $result = Invoke-ContabilidadeNativeCommand `
        -FilePath $env:ComSpec `
        -Arguments @('/d', '/c', $commandLine)
    Write-ContabilidadeNativeOutput -Result $result
    if (-not $result.Success) {
        throw "Validacao dos schemas falhou. Exit code: $($result.ExitCode)."
    }
}

function Invoke-PrimaComposeStartup {
    foreach ($required in (@($EnvFile, $ComposeBase, $ComposeMode, $ComposeOverride) + $AdditionalComposeFiles)) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
            throw "Arquivo obrigatorio ausente: $required"
        }
    }

    Assert-ContabilidadeDockerAvailable
    Assert-ComposeServices

    Write-Step '[START] Subindo a stack completa em uma unica transicao Docker Compose (modelo PRIMA)...'
    Write-Host 'Servicos: PostgreSQL, bootstrap, Keycloak, backend, automation-worker e frontend.'
    Write-Host "Timeout Compose: ${ComposeWaitTimeoutSeconds}s"
    $up = Invoke-Compose -Arguments @(
        'up',
        '--no-build',
        '-d',
        '--remove-orphans',
        '--wait',
        '--wait-timeout', [string]$ComposeWaitTimeoutSeconds
    ) -AllowFailure
    if (-not $up.Success) {
        throw "Docker Compose up --wait falhou. Exit code: $($up.ExitCode). $(Get-CommandDiagnostic -Result $up)"
    }
    Write-Ok 'Docker Compose declarou a stack pronta.'

    # Post-start authority. These checks execute inside the actual Compose network.
    $nginx = Invoke-Compose -Arguments @('exec', '-T', 'frontend', 'nginx', '-t') -AllowFailure
    if (-not $nginx.Success) {
        throw "Configuracao Nginx invalida depois do startup. Exit code: $($nginx.ExitCode). $(Get-CommandDiagnostic -Result $nginx)"
    }
    Write-Ok 'Nginx validado dentro da rede Compose.'

    Wait-ComposeCommand `
        -Description 'Backend readiness pela rede Compose' `
        -Arguments @(
            'exec', '-T', 'frontend',
            'wget', '-q', '-T', '5', '-O', '-',
            'http://backend:8080/actuator/health/readiness'
        )

    Wait-ComposeCommand `
        -Description 'Automation worker health' `
        -Arguments @(
            'exec', '-T', 'automation-worker',
            'node', '-e',
            "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
        )

    $frontendBaseUrl = $FrontendHealthUrl -replace '/healthz/?$', ''
    if ([string]::IsNullOrWhiteSpace($frontendBaseUrl)) {
        throw "FrontendHealthUrl invalida: $FrontendHealthUrl"
    }

    $null = Wait-Http200 `
        -Url $FrontendHealthUrl `
        -Description 'Frontend healthz'
    $home = Wait-Http200 `
        -Url ($frontendBaseUrl + '/') `
        -Description 'Frontend SPA'
    if ([string]$home.Content -notmatch '(?is)<(?:!doctype\s+html|html\b)') {
        throw 'Frontend respondeu HTTP 200, mas nao retornou um documento HTML.'
    }
    $null = Wait-Http200 `
        -Url ($frontendBaseUrl + '/api/info') `
        -Description 'Proxy frontend para /api/info'
    $null = Wait-Http200 `
        -Url ($frontendBaseUrl + '/auth/realms/contabilidade/.well-known/openid-configuration') `
        -Description 'Keycloak realm pelo proxy frontend'

    Validate-DatabaseSchemas

    $state = Invoke-Compose -Arguments @('ps', '-a') -AllowFailure -Quiet
    if (-not $state.Success) {
        throw "Nao foi possivel consultar o estado final da stack. Exit code: $($state.ExitCode)."
    }
    Write-Host ''
    Write-Host $state.StdOut.TrimEnd()

    return [pscustomobject]@{
        Mode = $Mode
        ApplicationUrl = $frontendBaseUrl
        ComposeProjectName = $ComposeProjectName
        Services = @(
            'postgres',
            'postgres-bootstrap',
            'keycloak',
            'backend',
            'automation-worker',
            'frontend'
        )
        StartupModel = 'PRIMA_SINGLE_COMPOSE_UP_WAIT'
        LegacyProbeName = $ProbeContainerName
    }
}

Set-Location $ProjectDir

try {
    $summary = Invoke-PrimaComposeStartup

    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host 'STACK COMPLETA PRONTA' -ForegroundColor Green
    Write-Host "Modo:       $($summary.Mode)"
    Write-Host "Aplicacao:  $($summary.ApplicationUrl)"
    Write-Host 'Servicos:   PostgreSQL, bootstrap, Keycloak, backend, worker e frontend'
    Write-Host 'Startup:    Compose unico com depends_on, healthchecks e --wait'
    Write-Host '============================================================' -ForegroundColor Green

    if ($NoExit) {
        return $summary
    }
    exit 0
}
catch {
    Show-ComposeEvidence
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host 'STARTUP DA STACK COMPLETA FALHOU' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host '============================================================' -ForegroundColor Red

    if ($NoExit) {
        throw
    }
    exit 1
}
