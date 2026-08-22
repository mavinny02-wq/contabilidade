[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ScriptsRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DockerModulePath = Join-Path $ScriptsRoot 'lib\contabilidade-docker.psm1'
$ProbeModulePath = Join-Path $ScriptsRoot 'lib\startup-probe.psm1'
$PreflightPath = Join-Path $ScriptsRoot 'invoke-startup-runtime-preflight.ps1'

function Assert-Contract {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "[PRIMA_STARTUP_CONTRACT] $Message"
    }
}

Import-Module $DockerModulePath -Force -ErrorAction Stop
Import-Module $ProbeModulePath -Force -ErrorAction Stop

# PRIMA's BAT layer consumes backslash-escaped quotes before Docker receives a Go template.
# PowerShell array invocation does not. The central adapter must convert those old shell
# escapes to Go raw-string delimiters before invoking docker.exe.
$delimiter = [string][char]96
$legacyLabelTemplate = '{{index .Config.Labels \"contabilidade.test-run\"}}'
$expectedLabelTemplate = '{{index .Config.Labels ' + $delimiter + 'contabilidade.test-run' + $delimiter + '}}'
$normalizedLabelTemplate = Convert-ContabilidadeDockerFormatArgument -Template $legacyLabelTemplate
Assert-Contract ($normalizedLabelTemplate -eq $expectedLabelTemplate) `
    'Template de label nao foi convertido para literal raw do Go template.'

$legacyMountTemplate = '{{range .Mounts}}{{if eq .Destination \"/var/lib/postgresql/data\"}}{{.Name}}{{end}}{{end}}'
$expectedMountTemplate = '{{range .Mounts}}{{if eq .Destination ' + $delimiter + '/var/lib/postgresql/data' + $delimiter + '}}{{.Name}}{{end}}{{end}}'
$normalizedMountTemplate = Convert-ContabilidadeDockerFormatArgument -Template $legacyMountTemplate
Assert-Contract ($normalizedMountTemplate -eq $expectedMountTemplate) `
    'Template de volume nao foi convertido para literal raw do Go template.'

$normalizedPair = @(Convert-ContabilidadeDockerArguments -Arguments @(
    'container', 'inspect', '--format', $legacyLabelTemplate, 'abc123'
))
Assert-Contract ($normalizedPair.Count -eq 5) 'Normalizacao alterou a cardinalidade dos argumentos Docker.'
Assert-Contract ($normalizedPair[3] -eq $expectedLabelTemplate) 'Valor apos --format nao foi normalizado.'

$normalizedEquals = @(Convert-ContabilidadeDockerArguments -Arguments @(
    'container', 'inspect', ('--format=' + $legacyLabelTemplate), 'abc123'
))
Assert-Contract ($normalizedEquals[2] -eq ('--format=' + $expectedLabelTemplate)) `
    'Forma --format=<template> nao foi normalizada.'

$invalidEscapeRejected = $false
try {
    $null = Convert-ContabilidadeDockerFormatArgument -Template '{{index .Config.Labels \"broken}}'
}
catch {
    $invalidEscapeRejected = $_.Exception.Message -match 'DOCKER_FORMAT_INVALID_ESCAPE'
}
Assert-Contract $invalidEscapeRejected 'Template com escape impar deveria ser rejeitado antes do Docker.'

$probeSource = Get-Content -LiteralPath $ProbeModulePath -Raw
Assert-Contract ($probeSource.Contains("@('container', 'inspect', `$Name)")) `
    'Probe deve usar docker container inspect sem template.'
Assert-Contract (-not $probeSource.Contains("@('container', 'inspect', '--format'")) `
    'Probe nao pode voltar a transportar Go template com aspas pelo binder nativo.'
Assert-Contract ($probeSource -match 'ConvertFrom-Json') `
    'Probe deve interpretar o JSON regular retornado pelo Docker.'

# Strings in the module export contract may legitimately name probe functions. Inspect the
# executable AST so only real command invocations can violate the read-only preflight rule.
$preflightTokens = $null
$preflightErrors = $null
$preflightAst = [System.Management.Automation.Language.Parser]::ParseFile(
    $PreflightPath,
    [ref]$preflightTokens,
    [ref]$preflightErrors
)
Assert-Contract ($preflightErrors.Count -eq 0) 'Parser falhou no preflight oficial.'
$preflightCommands = @(
    $preflightAst.FindAll({
        param($node)
        $node -is [System.Management.Automation.Language.CommandAst]
    }, $true) |
        ForEach-Object { $_.GetCommandName() } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
)
Assert-Contract ($preflightCommands -notcontains 'Remove-ContabilidadeStartupProbe') `
    'Preflight PRIMA-style deve ser read-only e nao pode limpar probe.'
Assert-Contract ($preflightCommands -notcontains 'Get-ContabilidadeStartupProbeState') `
    'Preflight PRIMA-style nao deve inspecionar container da aplicacao.'

# Exercise the real Windows native-command path without requiring Docker Desktop. A local
# docker.cmd fixture rejects extra arguments, so the old `--format <template> <name>` call
# would fail this contract immediately.
$fixtureRoot = Join-Path ([IO.Path]::GetTempPath()) ('contabilidade-prima-startup-' + [guid]::NewGuid().ToString('N'))
$fakeDockerPath = Join-Path $fixtureRoot 'docker.cmd'
$formatCapturePath = Join-Path $fixtureRoot 'format-argument.txt'
$previousPath = $env:Path
$previousCapturePath = $env:CONTABILIDADE_FAKE_DOCKER_CAPTURE
New-Item -ItemType Directory -Force -Path $fixtureRoot | Out-Null

$fakeDocker = @'
@echo off
setlocal EnableExtensions
if /i "%~1"=="container" if /i "%~2"=="inspect" (
  if /i "%~3"=="--format" (
    if not "%~5"=="format-probe" (
      >&2 echo unexpected formatted inspect target: %~5
      exit /b 94
    )
    > "%CONTABILIDADE_FAKE_DOCKER_CAPTURE%" echo %~4
    exit /b 0
  )
  if /i "%~3"=="owned-probe" (
    if not "%~4"=="" (
      >&2 echo unexpected extra Docker argument: %~4
      exit /b 92
    )
    echo [{"Id":"abc123","State":{"Status":"running"},"Config":{"Labels":{"contabilidade.local.startup-probe":"true"}}}]
    exit /b 0
  )
  if /i "%~3"=="missing-probe" (
    >&2 echo Error response from daemon: No such container: missing-probe
    exit /b 1
  )
  if /i "%~3"=="usage-probe" (
    >&2 echo template parsing error: unexpected backslash in operand
    exit /b 64
  )
)
>&2 echo unexpected Docker arguments: %*
exit /b 93
'@
[IO.File]::WriteAllText($fakeDockerPath, $fakeDocker, (New-Object Text.ASCIIEncoding))

try {
    $env:Path = $fixtureRoot + [IO.Path]::PathSeparator + $previousPath
    $env:CONTABILIDADE_FAKE_DOCKER_CAPTURE = $formatCapturePath

    $resolvedDocker = Get-Command docker -CommandType Application -ErrorAction Stop | Select-Object -First 1
    $resolvedDockerPath = if (-not [string]::IsNullOrWhiteSpace($resolvedDocker.Source)) {
        $resolvedDocker.Source
    }
    else {
        $resolvedDocker.Path
    }
    Assert-Contract ((Resolve-Path -LiteralPath $resolvedDockerPath).Path -eq (Resolve-Path -LiteralPath $fakeDockerPath).Path) `
        'Fixture docker.cmd nao recebeu precedencia no PATH do teste.'

    $formatCall = Invoke-ContabilidadeDocker -Arguments @(
        'container', 'inspect', '--format', $legacyLabelTemplate, 'format-probe'
    ) -AllowFailure -Quiet
    Assert-Contract $formatCall.Success 'Executor Docker rejeitou o template depois da normalizacao.'
    Assert-Contract (Test-Path -LiteralPath $formatCapturePath -PathType Leaf) `
        'Fixture Docker nao capturou o argumento --format.'
    $capturedFormat = (Get-Content -LiteralPath $formatCapturePath -Raw).Trim()
    Assert-Contract ($capturedFormat -eq $expectedLabelTemplate) `
        'Windows native binder nao recebeu o template Go normalizado.'

    $owned = Get-ContabilidadeStartupProbeState -Name 'owned-probe'
    Assert-Contract $owned.Exists 'Probe JSON existente nao foi reconhecido.'
    Assert-Contract $owned.Owned 'Label de ownership do probe nao foi lido do JSON.'
    Assert-Contract ($owned.ContainerId -eq 'abc123') 'Container ID do probe divergiu.'
    Assert-Contract ($owned.Status -eq 'running') 'Status do probe divergiu.'
    Assert-Contract ($owned.InspectSource -eq 'DOCKER_INSPECT_JSON') 'Autoridade do inspect nao foi JSON.'

    $missing = Get-ContabilidadeStartupProbeState -Name 'missing-probe'
    Assert-Contract (-not $missing.Exists) 'Probe ausente foi tratado como existente.'
    Assert-Contract ($missing.Category -eq 'CONTAINER_ABSENT_EXPECTED') `
        'Probe ausente nao recebeu classificacao idempotente.'

    $usageMessage = ''
    try {
        $null = Get-ContabilidadeStartupProbeState -Name 'usage-probe'
    }
    catch {
        $usageMessage = $_.Exception.Message
    }
    Assert-Contract ($usageMessage -match 'Exit code: 64') 'Exit 64 real nao foi preservado.'
    Assert-Contract ($usageMessage -match 'template parsing error') `
        'Detalhe redigido do Docker nao foi incluido no diagnostico.'
}
finally {
    $env:Path = $previousPath
    if ($null -eq $previousCapturePath) {
        Remove-Item Env:CONTABILIDADE_FAKE_DOCKER_CAPTURE -ErrorAction SilentlyContinue
    }
    else {
        $env:CONTABILIDADE_FAKE_DOCKER_CAPTURE = $previousCapturePath
    }
    Remove-Item -LiteralPath $fixtureRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host '[OK] Contrato PRIMA: preflight read-only, inspect JSON, quoting Docker normalizado e exit 64 diagnosticado.' -ForegroundColor Green
