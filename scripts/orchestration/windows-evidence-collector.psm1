Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ExitCodeInvalidArguments = 2
$script:ExitCodeWriteFailure = 3
$script:ExitCodeCollectionFailure = 4
$script:ExitCodePartialEvidence = 5

function ConvertTo-RedactedText {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) { return $null }

    $redacted = $Text
    $redacted = $redacted -replace '(?i)(https?://)[^\s/@:]+:[^\s/@]+@', '$1[REDACTED]@'
    $redacted = $redacted -replace '(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+', '$1[REDACTED]'
    $redacted = $redacted -replace '(?i)((?:authorization|password|passwd|pwd|token|secret|client_secret|apikey|api_key)\s*[=:]\s*)[^\s;]+', '$1[REDACTED]'
    $redacted = $redacted -replace '(?i)(?:[A-Z]:\\|/)(?:Users|home)[/\\][^\s"'']+', '[REDACTED_PATH]'
    $redacted = $redacted -replace '(?s)-----BEGIN [^-]*(?:PRIVATE KEY|CERTIFICATE)-----.*?-----END [^-]*(?:PRIVATE KEY|CERTIFICATE)-----', '[REDACTED]'
    return $redacted.Trim()
}

function Get-StableHash {
    param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        return ([BitConverter]::ToString($sha256.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally { $sha256.Dispose() }
}

function Invoke-EvidenceCommand {
    param([Parameter(Mandatory = $true)][string]$Command, [string[]]$Arguments = @())
    try {
        $executable = Get-Command $Command -ErrorAction SilentlyContinue
        if ($null -eq $executable) { return [ordered]@{ status = 'indisponivel'; exitCode = $null; output = $null } }
        $output = & $executable.Source @Arguments 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
        return [ordered]@{
            status = $(if ($exitCode -eq 0) { 'disponivel' } else { 'erro' })
            exitCode = [int]$exitCode
            output = ConvertTo-RedactedText $output
        }
    }
    catch { return [ordered]@{ status = 'erro'; exitCode = $null; output = ConvertTo-RedactedText $_.Exception.Message } }
}

function Invoke-EvidenceHttp {
    param([Parameter(Mandatory = $true)][string]$Url)
    try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Uri $Url
        return [ordered]@{ status = $(if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) { 'disponivel' } else { 'erro' }); statusCode = [int]$response.StatusCode }
    }
    catch {
        $statusCode = $null
        $responseProperty = $_.Exception.PSObject.Properties['Response']
        if ($null -ne $responseProperty -and $null -ne $responseProperty.Value) { $statusCode = [int]$responseProperty.Value.StatusCode }
        return [ordered]@{ status = 'erro'; statusCode = $statusCode }
    }
}

function Get-CommandVersion {
    param([string]$Command, [string[]]$Arguments)
    return Invoke-EvidenceCommand -Command $Command -Arguments $Arguments
}

function Get-ComposeArguments {
    param([string]$ProjectPath, [string]$Mode)
    $base = Join-Path $ProjectPath 'compose.yaml'
    $modeFile = Join-Path $ProjectPath $(if ($Mode -eq 'dev') { 'compose.dev.yaml' } else { 'compose.onpremise.yaml' })
    return @('compose', '-f', $base, '-f', $modeFile)
}

function Get-ServiceEvidence {
    param([string]$Service, [string[]]$ComposeArguments)
    $idResult = Invoke-EvidenceCommand -Command 'docker' -Arguments ($ComposeArguments + @('ps', '-a', '-q', $Service))
    $containerId = if ($idResult.status -eq 'disponivel' -and $idResult.output) { $idResult.output.Trim() } else { $null }
    if (-not $containerId) {
        return [ordered]@{ name = $Service; containerId = $null; status = $idResult.status; health = 'desconhecido'; exitCode = $null }
    }

    $inspect = Invoke-EvidenceCommand -Command 'docker' -Arguments @('inspect', '--format', '{{json .State}}', $containerId)
    if ($inspect.status -ne 'disponivel') {
        return [ordered]@{ name = $Service; containerId = $containerId; status = 'erro'; health = 'desconhecido'; exitCode = $null }
    }
    try {
        $state = $inspect.output | ConvertFrom-Json
        $healthProperty = $state.PSObject.Properties['Health']
        $health = if ($null -ne $healthProperty -and $null -ne $healthProperty.Value) { [string]$healthProperty.Value.Status } else { 'nao_configurado' }
        return [ordered]@{ name = $Service; containerId = $containerId; status = [string]$state.Status; health = $health; exitCode = [int]$state.ExitCode }
    }
    catch { return [ordered]@{ name = $Service; containerId = $containerId; status = 'erro'; health = 'desconhecido'; exitCode = $null } }
}

function New-WindowsEvidence {
    [CmdletBinding()]
    param(
        [ValidateSet('dev', 'onpremise')][string]$Mode = 'dev',
        [string]$ProjectPath = (Get-Location).Path,
        [AllowNull()][object]$BeforeEvidence = $null
    )

    $project = (Resolve-Path -LiteralPath $ProjectPath).Path
    $composeArguments = Get-ComposeArguments -ProjectPath $project -Mode $Mode
    $composeConfig = Invoke-EvidenceCommand -Command 'docker' -Arguments ($composeArguments + @('config'))
    $composeHash = if ($composeConfig.status -eq 'disponivel') { Get-StableHash $composeConfig.output } else { $null }
    $expected = @('postgres', 'postgres-bootstrap', 'backend', 'automation-worker', 'frontend')
    if ($Mode -eq 'onpremise') { $expected += 'keycloak' }
    $services = @($expected | ForEach-Object { Get-ServiceEvidence -Service $_ -ComposeArguments $composeArguments })

    $revision = Invoke-EvidenceCommand -Command 'git' -Arguments @('-C', $project, 'rev-parse', '--verify', 'HEAD')
    $dirty = Invoke-EvidenceCommand -Command 'git' -Arguments @('-C', $project, 'status', '--porcelain')
    $flyway = Invoke-EvidenceCommand -Command 'docker' -Arguments ($composeArguments + @('exec', '-T', 'postgres', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT version||''|''||success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1"'))
    $liquibase = if ($Mode -eq 'onpremise') { Invoke-EvidenceCommand -Command 'docker' -Arguments ($composeArguments + @('exec', '-T', 'postgres', 'sh', '-c', 'psql -U "$POSTGRES_USER" -d keycloak -Atc "SELECT COUNT(*) FROM databasechangelog"')) } else { $null }

    $reused = $null
    if ($null -ne $BeforeEvidence -and $null -ne $BeforeEvidence.services) {
        $beforePostgres = @($BeforeEvidence.services | Where-Object { $_.name -eq 'postgres' } | Select-Object -First 1)
        $afterPostgres = @($services | Where-Object { $_.name -eq 'postgres' } | Select-Object -First 1)
        if ($beforePostgres.Count -gt 0 -and $afterPostgres.Count -gt 0 -and $beforePostgres[0].containerId -and $afterPostgres[0].containerId) {
            $reused = $beforePostgres[0].containerId -eq $afterPostgres[0].containerId
        }
    }

    return [ordered]@{
        schemaVersion = '2.0.0'; collectedAtUtc = [DateTime]::UtcNow.ToString('o'); collectorVersion = '2.0.0'; mode = $Mode
        platform = [ordered]@{ os = [System.Environment]::OSVersion.VersionString; architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString(); machineNameHash = Get-StableHash ([System.Environment]::MachineName) }
        tools = [ordered]@{
            powershell = [ordered]@{ status = 'disponivel'; exitCode = 0; output = "$($PSVersionTable.PSEdition) $($PSVersionTable.PSVersion)" }
            git = Get-CommandVersion 'git' @('--version'); java = Get-CommandVersion 'java' @('-version'); maven = Get-CommandVersion 'mvn' @('--version')
            node = Get-CommandVersion 'node' @('--version'); npm = Get-CommandVersion 'npm' @('--version'); docker = Get-CommandVersion 'docker' @('version', '--format', '{{.Client.Version}}'); compose = Get-CommandVersion 'docker' @('compose', 'version', '--short')
        }
        repository = [ordered]@{ revision = $revision; dirty = $(if ($dirty.status -eq 'disponivel') { -not [string]::IsNullOrWhiteSpace($dirty.output) } else { $null }) }
        compose = [ordered]@{ status = $composeConfig.status; effectiveConfigSha256 = $composeHash }
        services = $services
        devIsolation = [ordered]@{ keycloakAbsent = $(if ($Mode -eq 'dev') { -not ($services.name -contains 'keycloak') } else { $null }); bootstrapNotRunning = $(if ($Mode -eq 'dev') { (@($services | Where-Object { $_.name -eq 'postgres-bootstrap' -and $_.status -eq 'running' }).Count -eq 0) } else { $null }) }
        endpoints = [ordered]@{ backendLiveness = Invoke-EvidenceHttp 'http://localhost:8080/actuator/health/liveness'; backendReadiness = Invoke-EvidenceHttp 'http://localhost:8080/actuator/health/readiness'; workerHealth = Invoke-EvidenceHttp 'http://localhost:3001/health'; frontendHealth = Invoke-EvidenceHttp 'http://localhost:8088/healthz'; frontendProxyInfo = Invoke-EvidenceHttp 'http://localhost:8088/api/info' }
        database = [ordered]@{ flywayLatest = $flyway; keycloakLiquibase = $liquibase }
        comparison = [ordered]@{ postgresContainerReused = $reused }
    }
}

function Get-EvidenceOutcome {
    param([object]$Evidence)
    $failedEndpoints = 0
    $endpointValues = @()
    if ($Evidence.endpoints -is [System.Collections.IDictionary]) {
        $endpointValues = @($Evidence.endpoints.Values)
    }
    else {
        foreach ($property in $Evidence.endpoints.PSObject.Properties) { $endpointValues += $property.Value }
    }
    foreach ($endpoint in $endpointValues) {
        if ($endpoint.status -ne 'disponivel') { $failedEndpoints++ }
    }
    $badServices = @($Evidence.services | Where-Object { $_.status -in @('erro', 'indisponivel', 'dead') -or ($_.status -eq 'exited' -and $_.exitCode -ne 0) }).Count
    if ($Evidence.compose.status -ne 'disponivel' -or $Evidence.database.flywayLatest.status -ne 'disponivel') { return 'erro' }
    if ($failedEndpoints -gt 0 -or $badServices -gt 0) { return 'parcial' }
    return 'completo'
}

function Write-EvidenceMarkdown {
    param([object]$Evidence, [string]$Destination, [string]$Outcome)
    $lines = @('# Evidencia de runtime Windows', '', "- Coletado em: $($Evidence.collectedAtUtc)", "- Modo: $($Evidence.mode)", "- Resultado: $Outcome", "- Revisao: $($Evidence.repository.revision.output)", "- Compose SHA-256: $($Evidence.compose.effectiveConfigSha256)", '', '## Servicos')
    foreach ($service in $Evidence.services) { $lines += "- $($service.name): status=$($service.status), health=$($service.health), exitCode=$($service.exitCode)" }
    [System.IO.File]::WriteAllLines($Destination, $lines, (New-Object System.Text.UTF8Encoding($false)))
}

function Write-WindowsEvidence {
    [CmdletBinding()]
    param([AllowEmptyString()][string]$Destination = '', [ValidateSet('dev', 'onpremise')][string]$Mode = 'dev', [string]$ProjectPath = (Get-Location).Path, [AllowEmptyString()][string]$BeforePath = '')
    if ([string]::IsNullOrWhiteSpace($Destination)) { return $script:ExitCodeInvalidArguments }
    try {
        $before = if ([string]::IsNullOrWhiteSpace($BeforePath)) { $null } else { Get-Content -LiteralPath $BeforePath -Raw | ConvertFrom-Json }
        $evidence = New-WindowsEvidence -Mode $Mode -ProjectPath $ProjectPath -BeforeEvidence $before
        $outcome = Get-EvidenceOutcome $evidence
        $evidence['outcome'] = $outcome
    }
    catch { [Console]::Error.WriteLine("Falha ao coletar evidencias: {0}" -f (ConvertTo-RedactedText $_.Exception.Message)); return $script:ExitCodeCollectionFailure }
    try {
        $absolutePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
        [System.IO.Directory]::CreateDirectory((Split-Path -Parent $absolutePath)) | Out-Null
        [System.IO.File]::WriteAllText($absolutePath, ($evidence | ConvertTo-Json -Depth 12), (New-Object System.Text.UTF8Encoding($false)))
        $markdownPath = [System.IO.Path]::ChangeExtension($absolutePath, '.md')
        Write-EvidenceMarkdown -Evidence $evidence -Destination $markdownPath -Outcome $outcome
        Write-Output $absolutePath
        Write-Output $markdownPath
        if ($outcome -eq 'completo') { return 0 }
        return $script:ExitCodePartialEvidence
    }
    catch { [Console]::Error.WriteLine("Falha ao gravar evidencias: {0}" -f (ConvertTo-RedactedText $_.Exception.Message)); return $script:ExitCodeWriteFailure }
}

Export-ModuleMember -Function ConvertTo-RedactedText, Get-StableHash, Invoke-EvidenceCommand, Invoke-EvidenceHttp, New-WindowsEvidence, Get-EvidenceOutcome, Write-WindowsEvidence
