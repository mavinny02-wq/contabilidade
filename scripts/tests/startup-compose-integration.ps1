param(
    [string]$EvidencePath,
    [switch]$KeepResources,
    [switch]$SkipFailureInjection
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$DockerModule = Join-Path $ProjectDir 'scripts\lib\contabilidade-docker.psm1'
$ProbeModule = Join-Path $ProjectDir 'scripts\lib\startup-probe.psm1'
$StartupScript = Join-Path $ProjectDir 'scripts\start-compose-sequential.ps1'
Import-Module $DockerModule -Force
Import-Module $ProbeModule -Force

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $Content.Replace("`r`n", "`n").Replace("`r", "`n"), $encoding)
}

function Get-FreeTcpPort {
    $listener = New-Object System.Net.Sockets.TcpListener([Net.IPAddress]::Loopback, 0)
    try {
        $listener.Start()
        return ([Net.IPEndPoint]$listener.LocalEndpoint).Port
    }
    finally {
        $listener.Stop()
    }
}

function Assert-Http200 {
    param([string]$Url, [int]$TimeoutSeconds = 30)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastError = $null
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $Url
            if ($response.StatusCode -eq 200) {
                return $response
            }
        }
        catch {
            $lastError = $_.Exception.Message
        }
        Start-Sleep -Seconds 1
    }
    throw "HTTP 200 nao observado em '$Url'. Ultimo erro: $lastError"
}

Assert-ContabilidadeDockerAvailable
$composeVersionResult = Invoke-ContabilidadeDocker -Arguments @('compose', 'version', '--short') -AllowFailure -Quiet
if (-not $composeVersionResult.Success) {
    throw "[ENVIRONMENT_LIMITATION] Nao foi possivel consultar a versao do Docker Compose. Exit code: $($composeVersionResult.ExitCode)."
}
$composeVersionMatch = [regex]::Match($composeVersionResult.StdOut, '(\d+\.\d+\.\d+)')
if (-not $composeVersionMatch.Success) {
    throw "[ENVIRONMENT_LIMITATION] Versao Docker Compose nao reconhecida: $($composeVersionResult.StdOut.Trim())"
}
$composeVersion = [version]$composeVersionMatch.Groups[1].Value
if ($composeVersion -lt [version]'2.24.4') {
    throw "[ENVIRONMENT_LIMITATION] O harness isolado requer Docker Compose 2.24.4+ para !override. Atual: $composeVersion."
}
$version = (Get-Content -LiteralPath (Join-Path $ProjectDir 'VERSION') -Raw).Trim()
$images = @(
    "contabilidade-backend:$version",
    "contabilidade-frontend:$version",
    "contabilidade-automation-worker:$version"
)
foreach ($image in $images) {
    $state = Test-ContabilidadeDockerImage -Image $image
    if (-not $state.Available) {
        throw "[ENVIRONMENT_LIMITATION][$($state.Category)] Imagem runtime ausente: $image. Execute o build local antes do harness Compose."
    }
}

$runId = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$projectName = "contabilidade-startup-it-$runId"
if ($projectName -notmatch '^contabilidade-startup-it-[a-z0-9-]+$') {
    throw 'Project name efemero invalido; cleanup recusado.'
}
$probeName = "$projectName-probe"
$testRoot = Join-Path $ProjectDir ".docker-local\startup-tests\$runId"
$envPath = Join-Path $testRoot '.env.startup-test'
$portsOverride = Join-Path $testRoot 'compose.ports.yaml'
$failureOverride = Join-Path $testRoot 'compose.failure.yaml'
New-Item -ItemType Directory -Force -Path $testRoot | Out-Null

$postgresPort = Get-FreeTcpPort
$backendPort = Get-FreeTcpPort
$workerPort = Get-FreeTcpPort
$frontendPort = Get-FreeTcpPort
$syntheticSecret = ([guid]::NewGuid().ToString('N')) + ([guid]::NewGuid().ToString('N'))

@(
    'POSTGRES_DB=contabilidade'
    'POSTGRES_USER=contabilidade'
    "POSTGRES_PASSWORD=synthetic-$runId"
    'KEYCLOAK_DB=keycloak'
    'KEYCLOAK_ADMIN=admin'
    "KEYCLOAK_ADMIN_PASSWORD=synthetic-$runId"
    "APP_WORKER_TOKEN=$syntheticSecret"
    "APP_AUTOMATION_SESSION_SIGNING_SECRET=$syntheticSecret"
    "APP_PORT=$frontendPort"
    "POSTGRES_PORT=$postgresPort"
    'STARTUP_POLL_SECONDS=1'
    'SERVICE_STARTUP_TIMEOUT_SECONDS=180'
    'KEYCLOAK_STARTUP_TIMEOUT_SECONDS=180'
    'FEDERAL_PORTAL_URL=http://127.0.0.1:9/unavailable'
    'SEFAZ_SP_PORTAL_URL=http://127.0.0.1:9/unavailable'
    'PGE_SP_PORTAL_URL=http://127.0.0.1:9/unavailable'
    'SERPRO_CND_TOKEN_URL=http://127.0.0.1:9/unavailable'
    'SERPRO_CND_API_URL=http://127.0.0.1:9/unavailable'
    'SERPRO_CND_CONSUMER_KEY='
    'SERPRO_CND_CONSUMER_SECRET='
    'SERPRO_CND_STATIC_BEARER_TOKEN='
    'SERPRO_CND_ALLOW_STATIC_BEARER=false'
) | Set-Content -LiteralPath $envPath -Encoding Ascii

$portsOverrideContent = @"
services:
  postgres:
    ports: !override
      - "127.0.0.1:${postgresPort}:5432"
  backend:
    ports: !override
      - "127.0.0.1:${backendPort}:8080"
  automation-worker:
    ports: !override
      - "127.0.0.1:${workerPort}:3001"
  frontend:
    ports: !override
      - "127.0.0.1:${frontendPort}:8080"
"@
Write-Utf8NoBom -Path $portsOverride -Content $portsOverrideContent

$failureOverrideContent = @"
services:
  backend:
    entrypoint: ["/bin/sh", "-c"]
    command: ["sleep 3600"]
    healthcheck:
      test: ["CMD", "false"]
      interval: 2s
      timeout: 1s
      retries: 2
      start_period: 1s
"@
Write-Utf8NoBom -Path $failureOverride -Content $failureOverrideContent

$composePrefix = @(
    'compose',
    '--project-name', $projectName,
    '--env-file', $envPath,
    '-f', (Join-Path $ProjectDir 'compose.yaml'),
    '-f', (Join-Path $ProjectDir 'compose.dev.yaml'),
    '-f', (Join-Path $ProjectDir '.docker-local\artifact-build\compose.local-artifacts.yaml'),
    '-f', $portsOverride
)

function Invoke-HarnessCompose {
    param([string[]]$Arguments, [switch]$AllowFailure, [switch]$Quiet)
    return Invoke-ContabilidadeCompose `
        -ComposePrefix $composePrefix `
        -Arguments $Arguments `
        -AllowFailure:$AllowFailure `
        -Quiet:$Quiet
}

function Invoke-PsqlScalar {
    param([string]$Sql)
    $result = Invoke-HarnessCompose -Arguments @(
        'exec', '-T', 'postgres',
        'psql', '-U', 'contabilidade', '-d', 'contabilidade', '-Atc', $Sql
    ) -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Consulta PostgreSQL do harness falhou. Exit code: $($result.ExitCode)."
    }
    return ($result.StdOut -split '\r?\n' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1).Trim()
}

function Get-ServiceId {
    param([string]$Service)
    $result = Invoke-HarnessCompose -Arguments @('ps', '-a', '-q', $Service) -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Nao foi possivel consultar service '$Service'."
    }
    return ($result.StdOut -split '\r?\n' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1).Trim()
}

function Assert-ProbeAbsent {
    $state = Get-ContabilidadeStartupProbeState -Name $probeName
    if ($state.Exists) {
        throw "Probe efemero permaneceu depois do startup: $($state.ContainerId)."
    }
}

$evidence = [ordered]@{
    gitSha = ''
    runId = $runId
    projectName = $projectName
    mode = 'dev'
    dockerContext = Get-ContabilidadeActiveDockerContext
    firstRun = $null
    secondRun = $null
    failureInjection = $null
    cleanup = $null
    status = 'RUNNING'
}

$gitResult = Invoke-ContabilidadeNativeCommand -FilePath 'git' -Arguments @('-C', $ProjectDir, 'rev-parse', 'HEAD')
if ($gitResult.Success) {
    $evidence.gitSha = $gitResult.StdOut.Trim()
}

try {
    $firstStarted = Get-Date
    $null = & $StartupScript `
        -Mode dev `
        -ComposeProjectName $projectName `
        -EnvFilePath $envPath `
        -AdditionalComposeFiles @($portsOverride) `
        -ProbeContainerName $probeName `
        -FrontendHealthUrl "http://127.0.0.1:$frontendPort/healthz" `
        -SkipDatabaseValidation `
        -NoExit

    $null = Assert-Http200 -Url "http://127.0.0.1:$backendPort/actuator/health/liveness"
    $null = Assert-Http200 -Url "http://127.0.0.1:$backendPort/actuator/health/readiness"
    $null = Assert-Http200 -Url "http://127.0.0.1:$workerPort/health"
    $null = Assert-Http200 -Url "http://127.0.0.1:$frontendPort/healthz"
    $null = Assert-Http200 -Url "http://127.0.0.1:$frontendPort/api/info"

    $flyway = Invoke-PsqlScalar -Sql "SELECT version || ':' || success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;"
    if ($flyway -ne '12:true') {
        throw "Frontier Flyway inesperada: $flyway"
    }
    $marker = "marker-$runId"
    $null = Invoke-PsqlScalar -Sql "CREATE TABLE IF NOT EXISTS startup_reliability_marker (marker text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now()); INSERT INTO startup_reliability_marker(marker) VALUES ('$marker') ON CONFLICT DO NOTHING; SELECT count(*) FROM startup_reliability_marker WHERE marker='$marker';"
    $markerCount = Invoke-PsqlScalar -Sql "SELECT count(*) FROM startup_reliability_marker WHERE marker='$marker';"
    if ($markerCount -ne '1') {
        throw 'Marker sintetico nao foi persistido.'
    }

    $postgresIdBefore = Get-ServiceId -Service 'postgres'
    if ([string]::IsNullOrWhiteSpace($postgresIdBefore)) {
        throw 'Container PostgreSQL nao foi localizado depois do primeiro startup.'
    }
    foreach ($forbiddenService in @('keycloak', 'postgres-bootstrap')) {
        if (-not [string]::IsNullOrWhiteSpace((Get-ServiceId -Service $forbiddenService))) {
            throw "Servico '$forbiddenService' nao deveria existir no modo dev."
        }
    }
    Assert-ProbeAbsent

    $evidence.firstRun = [ordered]@{
        exitCode = 0
        postgresContainerId = $postgresIdBefore
        flyway = $flyway
        markerCount = [int]$markerCount
        probeFinalState = 'absent'
        durationSeconds = [Math]::Round(((Get-Date) - $firstStarted).TotalSeconds, 3)
    }

    $secondStarted = Get-Date
    $null = & $StartupScript `
        -Mode dev `
        -ComposeProjectName $projectName `
        -EnvFilePath $envPath `
        -AdditionalComposeFiles @($portsOverride) `
        -ProbeContainerName $probeName `
        -FrontendHealthUrl "http://127.0.0.1:$frontendPort/healthz" `
        -SkipDatabaseValidation `
        -NoExit

    $postgresIdAfter = Get-ServiceId -Service 'postgres'
    if ($postgresIdAfter -ne $postgresIdBefore) {
        throw "PostgreSQL nao foi reutilizado. Antes=$postgresIdBefore Depois=$postgresIdAfter"
    }
    $markerCountAfter = Invoke-PsqlScalar -Sql "SELECT count(*) FROM startup_reliability_marker WHERE marker='$marker';"
    if ($markerCountAfter -ne '1') {
        throw 'Marker sintetico nao foi preservado no segundo startup.'
    }
    $null = Assert-Http200 -Url "http://127.0.0.1:$backendPort/actuator/health/readiness"
    $null = Assert-Http200 -Url "http://127.0.0.1:$workerPort/health"
    $null = Assert-Http200 -Url "http://127.0.0.1:$frontendPort/healthz"
    $null = Assert-Http200 -Url "http://127.0.0.1:$frontendPort/api/info"
    Assert-ProbeAbsent

    $evidence.secondRun = [ordered]@{
        exitCode = 0
        postgresContainerId = $postgresIdAfter
        postgresReused = $true
        markerCount = [int]$markerCountAfter
        probeFinalState = 'absent'
        durationSeconds = [Math]::Round(((Get-Date) - $secondStarted).TotalSeconds, 3)
    }

    if (-not $SkipFailureInjection) {
        $previousTimeout = $env:SERVICE_STARTUP_TIMEOUT_SECONDS
        $previousPoll = $env:STARTUP_POLL_SECONDS
        $failureMessage = ''
        try {
            $env:SERVICE_STARTUP_TIMEOUT_SECONDS = '12'
            $env:STARTUP_POLL_SECONDS = '1'
            try {
                $null = & $StartupScript `
                    -Mode dev `
                    -ComposeProjectName $projectName `
                    -EnvFilePath $envPath `
                    -AdditionalComposeFiles @($portsOverride, $failureOverride) `
                    -ProbeContainerName $probeName `
                    -FrontendHealthUrl "http://127.0.0.1:$frontendPort/healthz" `
                    -SkipDatabaseValidation `
                    -NoExit
                throw 'Falha controlada nao deixou o startup vermelho.'
            }
            catch {
                $failureMessage = $_.Exception.Message
                if ($failureMessage -eq 'Falha controlada nao deixou o startup vermelho.') {
                    throw
                }
            }
        }
        finally {
            if ($null -eq $previousTimeout) {
                Remove-Item Env:SERVICE_STARTUP_TIMEOUT_SECONDS -ErrorAction SilentlyContinue
            }
            else {
                $env:SERVICE_STARTUP_TIMEOUT_SECONDS = $previousTimeout
            }
            if ($null -eq $previousPoll) {
                Remove-Item Env:STARTUP_POLL_SECONDS -ErrorAction SilentlyContinue
            }
            else {
                $env:STARTUP_POLL_SECONDS = $previousPoll
            }
        }

        Assert-ProbeAbsent
        $markerAfterFailure = Invoke-PsqlScalar -Sql "SELECT count(*) FROM startup_reliability_marker WHERE marker='$marker';"
        if ($markerAfterFailure -ne '1') {
            throw 'Falha controlada removeu ou perdeu o marker PostgreSQL.'
        }
        $evidence.failureInjection = [ordered]@{
            expectedFailureObserved = $true
            message = $failureMessage
            markerCount = [int]$markerAfterFailure
            probeFinalState = 'absent'
        }
    }

    $evidence.status = 'PASS'
}
finally {
    if (-not $KeepResources) {
        if ($projectName -notmatch '^contabilidade-startup-it-[a-z0-9-]+$') {
            throw 'Cleanup Compose recusado por project name fora do prefixo de teste.'
        }
        $cleanup = Invoke-HarnessCompose -Arguments @('down', '--volumes', '--remove-orphans') -AllowFailure -Quiet
        $evidence.cleanup = [ordered]@{
            attempted = $true
            exitCode = $cleanup.ExitCode
            success = $cleanup.Success
        }
        if (-not $cleanup.Success) {
            Write-Warning "Cleanup do projeto efemero falhou. Project=$projectName Exit=$($cleanup.ExitCode)"
        }
    }
    else {
        $evidence.cleanup = [ordered]@{ attempted = $false; keptByRequest = $true }
    }

    if (-not [string]::IsNullOrWhiteSpace($EvidencePath)) {
        $directory = Split-Path -Parent $EvidencePath
        if (-not [string]::IsNullOrWhiteSpace($directory)) {
            New-Item -ItemType Directory -Force -Path $directory | Out-Null
        }
        $evidence | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $EvidencePath -Encoding UTF8
    }
}

$evidence
