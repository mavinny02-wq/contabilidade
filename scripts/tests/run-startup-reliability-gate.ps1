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
    param(
        [string]$Name,
        [string]$Status,
        [int]$ExitCode,
        [string]$Evidence
    )
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

$status = 'RUNNING'
$failure = $null
$dockerContext = $null
$dockerVersion = $null
$composeVersion = $null

try {
    Invoke-StartupPowerShellPreflight -ScriptsPath (Join-Path $ProjectDir 'scripts')
    Add-StepResult -Name 'powershell-parser' -Status 'PASS' -ExitCode 0 -Evidence 'All ps1/psm1 parsed.'

    $null = Invoke-CheckedNative `
        -Name 'docker-orchestration-guard' `
        -FilePath 'node' `
        -Arguments @((Join-Path $ProjectDir 'scripts\codex\validate-docker-orchestration.mjs'))
    $null = Invoke-CheckedNative `
        -Name 'docker-orchestration-tests' `
        -FilePath 'node' `
        -Arguments @('--test', (Join-Path $ProjectDir 'scripts\codex\validate-docker-orchestration.test.mjs'))

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
        $failedCount = $pesterResult.FailedCount
    }
    else {
        $pesterResult = Invoke-Pester -Script $testPaths -PassThru -Show Summary
        $failedCount = $pesterResult.FailedCount
    }
    if ($failedCount -gt 0) {
        throw "Pester encontrou $failedCount teste(s) com falha."
    }
    Add-StepResult -Name 'pester-startup' -Status 'PASS' -ExitCode 0 -Evidence "Pester $($pesterModule.Version); failed=0"

    if ($RunDockerIntegration -or $RunComposeIntegration -or $RunOfficialStartup) {
        Assert-ContabilidadeDockerAvailable
        $dockerContext = Get-ContabilidadeActiveDockerContext
        $dockerVersionResult = Invoke-ContabilidadeDocker -Arguments @('version', '--format', '{{.Server.Version}}') -AllowFailure -Quiet
        $composeVersionResult = Invoke-ContabilidadeDocker -Arguments @('compose', 'version', '--short') -AllowFailure -Quiet
        if ($dockerVersionResult.Success) {
            $dockerVersion = $dockerVersionResult.StdOut.Trim()
        }
        if ($composeVersionResult.Success) {
            $composeVersion = $composeVersionResult.StdOut.Trim()
        }
    }

    if ($RunDockerIntegration) {
        $dockerEvidencePath = Join-Path $OutputDirectory 'startup-docker-integration.json'
        $dockerEvidence = & (Join-Path $ProjectDir 'scripts\tests\startup-docker-integration.ps1') `
            -EvidencePath $dockerEvidencePath
        if ($dockerEvidence.status -ne 'PASS') {
            throw 'Docker lifecycle integration nao terminou em PASS.'
        }
        Add-StepResult -Name 'docker-lifecycle-integration' -Status 'PASS' -ExitCode 0 -Evidence $dockerEvidencePath
    }
    else {
        Add-StepResult -Name 'docker-lifecycle-integration' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunDockerIntegration.'
    }

    if ($RunComposeIntegration) {
        $composeEvidencePath = Join-Path $OutputDirectory 'startup-compose-integration.json'
        $composeEvidence = & (Join-Path $ProjectDir 'scripts\tests\startup-compose-integration.ps1') `
            -EvidencePath $composeEvidencePath
        if ($composeEvidence.status -ne 'PASS') {
            throw 'Compose startup integration nao terminou em PASS.'
        }
        Add-StepResult -Name 'compose-startup-twice' -Status 'PASS' -ExitCode 0 -Evidence $composeEvidencePath
    }
    else {
        Add-StepResult -Name 'compose-startup-twice' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunComposeIntegration.'
    }

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
            Add-StepResult -Name "official-startup-$attempt" -Status 'PASS' -ExitCode $result.ExitCode -Evidence $logPath
        }
        $probeState = Get-ContabilidadeStartupProbeState
        if ($probeState.Exists) {
            throw "Probe oficial permaneceu depois das duas execucoes: $($probeState.ContainerId)."
        }
    }
    else {
        Add-StepResult -Name 'official-startup-twice' -Status 'NOT_RUN' -ExitCode 0 -Evidence 'Use -RunOfficialStartup.'
    }

    if ($RunDockerIntegration -and $RunComposeIntegration -and $RunOfficialStartup) {
        $status = 'PASS'
    }
    else {
        $status = 'PASS_STRUCTURAL_RUNTIME_PENDING'
    }
}
catch {
    $failure = Protect-StartupEvidenceText -Value $_.Exception.Message
    $status = 'FAIL'
    Add-StepResult -Name 'gate-failure' -Status 'FAIL' -ExitCode 1 -Evidence $failure
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
    if ($safeEvidence.Length -gt 240) {
        $safeEvidence = $safeEvidence.Substring(0, 240) + '...'
    }
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

if ($status -eq 'FAIL') {
    exit 1
}
exit 0
