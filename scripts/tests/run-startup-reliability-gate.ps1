param(
    [switch]$RunDockerIntegration,
    [switch]$RunComposeIntegration,
    [switch]$RunOfficialStartup,
    [string]$OutputDirectory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $ProjectDir '.docker-local\startup-reliability-evidence'
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

Import-Module (Join-Path $ProjectDir 'scripts\lib\startup-preflight.psm1') -Force
Import-Module (Join-Path $ProjectDir 'scripts\lib\contabilidade-docker.psm1') -Force
Import-Module (Join-Path $ProjectDir 'scripts\lib\startup-probe.psm1') -Force
Import-Module (Join-Path $ProjectDir 'scripts\lib\native-process.psm1') -Force

$startedAt = Get-Date
$gitResult = Invoke-ContabilidadeNativeCommand -FilePath 'git' -Arguments @('-C', $ProjectDir, 'rev-parse', 'HEAD')
$gitSha = if ($gitResult.Success) { $gitResult.StdOut.Trim() } else { 'UNKNOWN' }
$runId = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$jsonPath = Join-Path $OutputDirectory 'startup-reliability-evidence.json'
$markdownPath = Join-Path $OutputDirectory 'startup-reliability-evidence.md'
$steps = New-Object System.Collections.Generic.List[object]

function Protect-StartupEvidenceText {
    param([AllowNull()][string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ''
    }

    $redacted = $Value
    $redacted = [regex]::Replace($redacted, '(?i)\b(authorization\s*:\s*bearer|bearer)\s+[A-Za-z0-9._~+\-/=]+', '$1 [REDACTED]')
    $redacted = [regex]::Replace($redacted, '(?i)\b(password|passwd|token|secret|client_secret)\s*[:=]\s*[^\s;]+', '$1=[REDACTED]')
    $redacted = [regex]::Replace($redacted, '(?i)(https?://)[^\s/@:]+:[^\s/@]+@', '$1[REDACTED]@')
    return $redacted
}

function Add-StepResult {
    param([string]$Name, [string]$Status, [int]$ExitCode, [string]$Evidence)
    $steps.Add([pscustomobject]@{
        name = $Name
        status = $Status
        exitCode = $ExitCode
        evidence = Protect-StartupEvidenceText -Value $Evidence
    })
}

function Invoke-CheckedNative {
    param([string]$Name, [string]$FilePath, [string[]]$Arguments)
    $result = Invoke-ContabilidadeNativeCommand -FilePath $FilePath -Arguments $Arguments
    if (-not $result.Success) {
        throw "$Name falhou. Exit code: $($result.ExitCode). $($result.StdErr.Trim())"
    }
    Add-StepResult -Name $Name -Status 'PASS' -ExitCode $result.ExitCode -Evidence $result.StdOut.Trim()
    return $result
}

function Get-OfficialEnvValue {
    param([string]$Name, [string]$DefaultValue)

    $envPath = Join-Path $ProjectDir '.env'
    if (Test-Path -LiteralPath $envPath) {
        foreach ($line in Get-Content -LiteralPath $envPath) {
            if ($line -match '^\s*#') { continue }
            if ($line -match ('^\s*' + [regex]::Escape($Name) + '\s*=\s*(.*)\s*$')) {
                $value = $Matches[1].Trim().Trim('"').Trim("'")
                if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
            }
        }
    }
    return $DefaultValue
}

function Get-OfficialComposePrefix {
    $envPath = Join-Path $ProjectDir '.env'
    $override = Join-Path $ProjectDir '.docker-local\artifact-build\compose.local-artifacts.yaml'
    foreach ($required in @($envPath, $override)) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
            throw "[ENVIRONMENT_LIMITATION] Arquivo do startup oficial ausente: $required"
        }
    }
    return @(
        'compose', '--env-file', $envPath,
        '-f', (Join-Path $ProjectDir 'compose.yaml'),
        '-f', (Join-Path $ProjectDir 'compose.dev.yaml'),
        '-f', $override
    )
}

function Invoke-OfficialCompose {
    param([string[]]$Arguments, [switch]$AllowFailure, [switch]$Quiet)
    return Invoke-ContabilidadeCompose `
        -ComposePrefix (Get-OfficialComposePrefix) `
        -Arguments $Arguments `
        -AllowFailure:$AllowFailure `
        -Quiet:$Quiet
}

function Get-OfficialServiceId {
    param([string]$Service)
    $result = Invoke-OfficialCompose -Arguments @('ps', '-a', '-q', $Service) -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Nao foi possivel consultar o servico oficial '$Service'. Exit code: $($result.ExitCode)."
    }
    $value = $result.StdOut -split '\r?\n' |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Select-Object -First 1
    return $(if ($null -eq $value) { '' } else { ([string]$value).Trim() })
}

function Get-OfficialPostgresVolume {
    param([string]$ContainerId)
    $format = '{{range .Mounts}}{{if eq .Destination "/var/lib/postgresql/data"}}{{.Name}}{{end}}{{end}}'
    $result = Invoke-ContabilidadeDocker -Arguments @('container', 'inspect', '--format', $format, $ContainerId) -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Nao foi possivel consultar o volume PostgreSQL oficial. Exit code: $($result.ExitCode)."
    }
    return $result.StdOut.Trim()
}

function Invoke-OfficialPsqlScalar {
    param([string]$Sql)
    $database = Get-OfficialEnvValue -Name 'POSTGRES_DB' -DefaultValue 'contabilidade'
    $user = Get-OfficialEnvValue -Name 'POSTGRES_USER' -DefaultValue 'contabilidade'
    $result = Invoke-OfficialCompose -Arguments @(
        'exec', '-T', 'postgres',
        'psql', '-U', $user, '-d', $database, '-Atc', $Sql
    ) -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Consulta PostgreSQL oficial falhou. Exit code: $($result.ExitCode)."
    }
    $value = $result.StdOut -split '\r?\n' |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Select-Object -First 1
    return $(if ($null -eq $value) { '' } else { ([string]$value).Trim() })
}

function Assert-OfficialHttp200 {
    param([string]$Url, [int]$TimeoutSeconds = 60)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastError = ''
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 $Url
            if ($response.StatusCode -eq 200) { return }
        }
        catch { $lastError = $_.Exception.Message }
        Start-Sleep -Seconds 2
    }
    throw "HTTP 200 oficial nao observado em '$Url'. Ultimo erro: $lastError"
}

function Assert-OfficialStack {
    $appPort = Get-OfficialEnvValue -Name 'APP_PORT' -DefaultValue '8088'
    Assert-OfficialHttp200 -Url 'http://127.0.0.1:8080/actuator/health/liveness'
    Assert-OfficialHttp200 -Url 'http://127.0.0.1:8080/actuator/health/readiness'
    Assert-OfficialHttp200 -Url 'http://127.0.0.1:3001/health'
    Assert-OfficialHttp200 -Url "http://127.0.0.1:$appPort/healthz"
    Assert-OfficialHttp200 -Url "http://127.0.0.1:$appPort/api/info"

    foreach ($forbidden in @('keycloak', 'postgres-bootstrap')) {
        if (-not [string]::IsNullOrWhiteSpace((Get-OfficialServiceId -Service $forbidden))) {
            throw "Servico '$forbidden' foi iniciado indevidamente no modo dev oficial."
        }
    }
    $probe = Get-ContabilidadeStartupProbeState
    if ($probe.Exists) {
        throw "Probe oficial permaneceu depois do startup: $($probe.ContainerId)."
    }
    $flyway = Invoke-OfficialPsqlScalar -Sql "SELECT version || ':' || success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1;"
    if ($flyway -ne '12:true') {
        throw "Frontier Flyway oficial inesperada: $flyway"
    }
    return $flyway
}

$status = 'RUNNING'
$failure = $null
$dockerContext = $null
$dockerVersion = $null
$composeVersion = $null
$officialMarkerPath = $null
$officialPostgresBefore = $null
$officialVolumeBefore = $null

try {
    Invoke-StartupPowerShellPreflight -ScriptsPath (Join-Path $ProjectDir 'scripts')
    Add-StepResult -Name 'powershell-parser' -Status 'PASS' -ExitCode 0 -Evidence 'All ps1/psm1 parsed.'

    $null = Invoke-CheckedNative -Name 'docker-orchestration-guard' -FilePath 'node' -Arguments @((Join-Path $ProjectDir 'scripts\codex\validate-docker-orchestration.mjs'))
    $null = Invoke-CheckedNative -Name 'docker-orchestration-tests' -FilePath 'node' -Arguments @('--test', (Join-Path $ProjectDir 'scripts\codex\validate-docker-orchestration.test.mjs'))

    $pesterModule = Get-Module -ListAvailable Pester | Sort-Object Version -Descending | Select-Object -First 1
    if ($null -eq $pesterModule) {
        throw '[ENVIRONMENT_LIMITATION] Pester nao esta instalado. Instale Pester 5 e repita o gate.'
    }
    Import-Module $pesterModule.Path -Force
    $testPaths = @(
        (Join-Path $ProjectDir 'scripts\tests\contabilidade-docker.Tests.ps1'),
        (Join-Path $ProjectDir 'scripts\tests\startup-probe.Tests.ps1'),
        (Join-Path $ProjectDir 'scripts\tests\startup-native-process.Tests.ps1'),
        (Join-Path $ProjectDir 'scripts\tests\startup-preflight.Tests.ps1'),
        (Join-Path $ProjectDir 'scripts\tests\native-process.Tests.ps1')
    )
    if ($pesterModule.Version.Major -ge 5) {
        $pesterResult = Invoke-Pester -Path $testPaths -PassThru -Output Detailed
    }
    else {
        $pesterResult = Invoke-Pester -Script $testPaths -PassThru -Show Summary
    }
    if ($pesterResult.FailedCount -gt 0) {
        throw "Pester encontrou $($pesterResult.FailedCount) teste(s) com falha."
    }
    Add-StepResult -Name 'pester-startup' -Status 'PASS' -ExitCode 0 -Evidence "Pester $($pesterModule.Version); failed=0"

    if ($RunDockerIntegration -or $RunComposeIntegration -or $RunOfficialStartup) {
        Assert-ContabilidadeDockerAvailable
        $dockerContext = Get-ContabilidadeActiveDockerContext
        $dockerVersionResult = Invoke-ContabilidadeDocker -Arguments @('version', '--format', '{{.Server.Version}}') -AllowFailure -Quiet
        $composeVersionResult = Invoke-ContabilidadeDocker -Arguments @('compose', 'version', '--short') -AllowFailure -Quiet
        if ($dockerVersionResult.Success) { $dockerVersion = $dockerVersionResult.StdOut.Trim() }
        if ($composeVersionResult.Success) { $composeVersion = $composeVersionResult.StdOut.Trim() }
    }

    # Run the official command first when requested. This also prepares runtime images on a clean host.
    if ($RunOfficialStartup) {
        if ([string]::IsNullOrWhiteSpace($env:ComSpec)) {
            throw '[ENVIRONMENT_LIMITATION] ComSpec/cmd.exe indisponivel para o BAT oficial.'
        }
        $officialBat = Join-Path $ProjectDir 'START_CONTABILIDADE.bat'
        for ($attempt = 1; $attempt -le 2; $attempt++) {
            $logPath = Join-Path $OutputDirectory "official-startup-attempt-$attempt.log"
            $commandLine = '(echo.)|call "' + $officialBat + '" dev'
            $result = Invoke-CmdCommand -CommandLine $commandLine -LogPath $logPath
            if (-not $result.Succeeded) {
                throw "START_CONTABILIDADE.bat dev falhou na tentativa $attempt. Exit code: $($result.ExitCode). Log: $logPath"
            }

            $flyway = Assert-OfficialStack
            $postgresId = Get-OfficialServiceId -Service 'postgres'
            if ([string]::IsNullOrWhiteSpace($postgresId)) {
                throw "PostgreSQL oficial ausente depois da tentativa $attempt."
            }
            $volumeName = Get-OfficialPostgresVolume -ContainerId $postgresId

            if ($attempt -eq 1) {
                $officialPostgresBefore = $postgresId
                $officialVolumeBefore = $volumeName
                $officialMarkerPath = "/var/lib/postgresql/data/.contabilidade-startup-reliability-$runId"
                $marker = Invoke-OfficialCompose -Arguments @(
                    'exec', '-T', 'postgres', 'sh', '-ec',
                    "printf '%s' '$runId' > '$officialMarkerPath'"
                ) -AllowFailure -Quiet
                if (-not $marker.Success) {
                    throw "Nao foi possivel criar marker sintetico no volume PostgreSQL. Exit code: $($marker.ExitCode)."
                }
            }
            else {
                if ($postgresId -ne $officialPostgresBefore) {
                    throw "PostgreSQL oficial nao foi reutilizado. Antes=$officialPostgresBefore Depois=$postgresId"
                }
                if ($volumeName -ne $officialVolumeBefore) {
                    throw "Volume PostgreSQL oficial mudou. Antes=$officialVolumeBefore Depois=$volumeName"
                }
                $markerRead = Invoke-OfficialCompose -Arguments @('exec', '-T', 'postgres', 'cat', $officialMarkerPath) -AllowFailure -Quiet
                if (-not $markerRead.Success -or $markerRead.StdOut.Trim() -ne $runId) {
                    throw 'Marker sintetico do volume PostgreSQL nao foi preservado no segundo startup.'
                }
            }

            Add-StepResult -Name "official-startup-$attempt" -Status 'PASS' -ExitCode $result.ExitCode -Evidence "log=$logPath; postgres=$postgresId; volume=$volumeName; flyway=$flyway; probe=absent"
        }
    }
    else {
        Add-StepResult -Name 'official-startup-twice' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunOfficialStartup.'
    }

    if ($RunDockerIntegration) {
        $dockerEvidencePath = Join-Path $OutputDirectory 'startup-docker-integration.json'
        $dockerEvidence = & (Join-Path $ProjectDir 'scripts\tests\startup-docker-integration.ps1') -EvidencePath $dockerEvidencePath
        if ($dockerEvidence.status -ne 'PASS') { throw 'Docker lifecycle integration nao terminou em PASS.' }
        Add-StepResult -Name 'docker-lifecycle-integration' -Status 'PASS' -ExitCode 0 -Evidence $dockerEvidencePath
    }
    else {
        Add-StepResult -Name 'docker-lifecycle-integration' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunDockerIntegration.'
    }

    if ($RunComposeIntegration) {
        $composeEvidencePath = Join-Path $OutputDirectory 'startup-compose-integration.json'
        $composeEvidence = & (Join-Path $ProjectDir 'scripts\tests\startup-compose-integration.ps1') -EvidencePath $composeEvidencePath
        if ($composeEvidence.status -ne 'PASS') { throw 'Compose startup integration nao terminou em PASS.' }
        Add-StepResult -Name 'compose-startup-twice' -Status 'PASS' -ExitCode 0 -Evidence $composeEvidencePath
    }
    else {
        Add-StepResult -Name 'compose-startup-twice' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunComposeIntegration.'
    }

    $status = if ($RunDockerIntegration -and $RunComposeIntegration -and $RunOfficialStartup) {
        'PASS'
    }
    else {
        'PASS_STRUCTURAL_RUNTIME_PENDING'
    }
}
catch {
    $failure = Protect-StartupEvidenceText -Value $_.Exception.Message
    $status = 'FAIL'
    Add-StepResult -Name 'gate-failure' -Status 'FAIL' -ExitCode 1 -Evidence $failure
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($officialMarkerPath)) {
        try {
            $cleanupMarker = Invoke-OfficialCompose -Arguments @('exec', '-T', 'postgres', 'rm', '-f', $officialMarkerPath) -AllowFailure -Quiet
            if (-not $cleanupMarker.Success -and $status -ne 'FAIL') {
                $failure = "Falha ao remover marker sintetico do volume PostgreSQL. Exit code: $($cleanupMarker.ExitCode)."
                $status = 'FAIL'
                Add-StepResult -Name 'official-marker-cleanup' -Status 'FAIL' -ExitCode $cleanupMarker.ExitCode -Evidence $failure
            }
        }
        catch {
            if ($status -ne 'FAIL') {
                $failure = Protect-StartupEvidenceText -Value $_.Exception.Message
                $status = 'FAIL'
                Add-StepResult -Name 'official-marker-cleanup' -Status 'FAIL' -ExitCode 1 -Evidence $failure
            }
        }
    }
}

$finishedAt = Get-Date
$evidence = [ordered]@{
    gitSha = $gitSha
    runId = $runId
    status = $status
    mode = 'startup-reliability'
    powershellVersion = $PSVersionTable.PSVersion.ToString()
    dockerVersion = $dockerVersion
    composeVersion = $composeVersion
    dockerContext = $dockerContext
    startedAt = $startedAt.ToUniversalTime().ToString('o')
    finishedAt = $finishedAt.ToUniversalTime().ToString('o')
    durationSeconds = [Math]::Round(($finishedAt - $startedAt).TotalSeconds, 3)
    steps = @($steps)
    failure = $failure
}
$evidence | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

$markdown = New-Object System.Collections.Generic.List[string]
$markdown.Add('# Startup reliability evidence')
$markdown.Add('')
$markdown.Add(("- Git SHA: ``{0}``" -f $gitSha))
$markdown.Add(("- Run ID: ``{0}``" -f $runId))
$markdown.Add(("- Status: ``{0}``" -f $status))
$markdown.Add(("- PowerShell: ``{0}``" -f $PSVersionTable.PSVersion))
$markdown.Add(("- Docker: ``{0}``" -f $(if ($dockerVersion) { $dockerVersion } else { 'NOT_RUN' })))
$markdown.Add(("- Compose: ``{0}``" -f $(if ($composeVersion) { $composeVersion } else { 'NOT_RUN' })))
$markdown.Add(("- Docker context: ``{0}``" -f $(if ($dockerContext) { $dockerContext } else { 'NOT_RUN' })))
$markdown.Add('')
$markdown.Add('| Step | Status | Exit | Evidence |')
$markdown.Add('|---|---|---:|---|')
foreach ($step in $steps) {
    $safeEvidence = ([string]$step.evidence).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    if ($safeEvidence.Length -gt 240) { $safeEvidence = $safeEvidence.Substring(0, 240) + '...' }
    $markdown.Add("| $($step.name) | $($step.status) | $($step.exitCode) | $safeEvidence |")
}
if ($failure) {
    $markdown.Add('')
    $markdown.Add('## Failure')
    $markdown.Add('')
    $markdown.Add($failure)
}
$markdown | Set-Content -LiteralPath $markdownPath -Encoding UTF8

Write-Host "STATUS: $status"
Write-Host "JSON:   $jsonPath"
Write-Host "MD:     $markdownPath"

if ($status -eq 'FAIL') { exit 1 }
exit 0
