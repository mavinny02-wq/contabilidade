[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ScriptsRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$modulePaths = [ordered]@{
    'startup-preflight' = Join-Path $ScriptsRoot 'lib\startup-preflight.psm1'
    'contabilidade-docker' = Join-Path $ScriptsRoot 'lib\contabilidade-docker.psm1'
    'startup-probe' = Join-Path $ScriptsRoot 'lib\startup-probe.psm1'
    'native-process' = Join-Path $ScriptsRoot 'lib\native-process.psm1'
}

function Assert-Contract {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "[STARTUP_POWERSHELL_CONTRACT] $Message"
    }
}

function Assert-VisibleModuleCommands {
    param([string]$ModuleName, [string[]]$Commands)

    $module = Get-Module -Name $ModuleName | Select-Object -Last 1
    Assert-Contract ($null -ne $module) "Modulo nao carregado: $ModuleName"

    foreach ($commandName in $Commands) {
        Assert-Contract ($module.ExportedCommands.ContainsKey($commandName)) `
            "$ModuleName nao exporta $commandName"

        $visible = Get-Command -Name $commandName -ErrorAction SilentlyContinue |
            Where-Object { $_.Source -eq $ModuleName -or $_.ModuleName -eq $ModuleName } |
            Select-Object -First 1
        Assert-Contract ($null -ne $visible) `
            "$commandName deixou de estar visivel depois dos imports de producao"
    }
}

$requiredCommands = @{
    'startup-preflight' = @('Invoke-StartupPowerShellPreflight')
    'contabilidade-docker' = @(
        'Invoke-ContabilidadeNativeCommand',
        'Write-ContabilidadeNativeOutput',
        'Convert-ContabilidadeDockerFormatArgument',
        'Convert-ContabilidadeDockerArguments',
        'Invoke-ContabilidadeDocker',
        'Invoke-ContabilidadeCompose',
        'Test-ContabilidadeDockerContainerAbsent',
        'Test-ContabilidadeDockerImageMissing',
        'Test-ContabilidadeDockerDaemonUnavailable',
        'Get-ContabilidadeDockerFailureCategory',
        'Test-ContabilidadeDockerImage',
        'Test-ContabilidadeRuntimeImage',
        'Assert-ContabilidadeDockerAvailable',
        'Get-ContabilidadeActiveDockerContext',
        'Test-ContabilidadeDockerDnsFailure',
        'Get-ContabilidadeFailedRegistryHost'
    )
    'startup-probe' = @(
        'New-ContabilidadeStartupProbeResult',
        'Get-ContabilidadeStartupProbeState',
        'Remove-ContabilidadeStartupProbe',
        'Start-ContabilidadeStartupProbe',
        'Invoke-ContabilidadeStartupProbeRequest',
        'Invoke-ContabilidadeWithProbeCleanup'
    )
    'native-process' = @('Invoke-NativeProcess', 'Invoke-CmdCommand')
}

foreach ($path in $modulePaths.Values) {
    Assert-Contract (Test-Path -LiteralPath $path -PathType Leaf) "Modulo ausente: $path"
}

# Reproduce the production import order without invoking Docker. The original regression
# occurred when startup-probe force-reloaded contabilidade-docker and removed its commands
# from the caller's Windows PowerShell 5.1 session state.
Remove-Module -Name @(
    'startup-probe',
    'contabilidade-docker',
    'startup-preflight',
    'native-process'
) -Force -ErrorAction SilentlyContinue
Import-Module $modulePaths['startup-preflight'] -Force -ErrorAction Stop
Import-Module $modulePaths['contabilidade-docker'] -Force -ErrorAction Stop
Assert-VisibleModuleCommands 'contabilidade-docker' $requiredCommands['contabilidade-docker']
Import-Module $modulePaths['startup-probe'] -Force -ErrorAction Stop
Assert-VisibleModuleCommands 'contabilidade-docker' $requiredCommands['contabilidade-docker']
Assert-VisibleModuleCommands 'startup-probe' $requiredCommands['startup-probe']
Import-Module $modulePaths['native-process'] -Force -ErrorAction Stop
Assert-VisibleModuleCommands 'startup-preflight' $requiredCommands['startup-preflight']
Assert-VisibleModuleCommands 'native-process' $requiredCommands['native-process']

# Repeated imports must remain idempotent and cannot erase sibling module exports.
1..2 | ForEach-Object {
    Import-Module $modulePaths['startup-probe'] -Force -ErrorAction Stop
    Assert-VisibleModuleCommands 'contabilidade-docker' $requiredCommands['contabilidade-docker']
    Assert-VisibleModuleCommands 'startup-probe' $requiredCommands['startup-probe']
}

$probeSource = Get-Content -LiteralPath $modulePaths['startup-probe'] -Raw
Assert-Contract ($probeSource -notmatch '(?im)Import-Module\s+\$dockerModulePath\s+-Force\b') `
    'startup-probe nao pode force-reload contabilidade-docker'

# Parse every operational PowerShell file and verify that project-specific command calls
# resolve either to a local function or to one of the exported project modules.
$exportedCommands = @{}
foreach ($moduleName in $modulePaths.Keys) {
    $module = Get-Module -Name $moduleName | Select-Object -Last 1
    foreach ($commandName in $module.ExportedCommands.Keys) {
        $exportedCommands[$commandName] = $moduleName
    }
}

$files = @(Get-ChildItem -LiteralPath $ScriptsRoot -Recurse -File -ErrorAction Stop |
    Where-Object { $_.Extension -in @('.ps1', '.psm1') } |
    Sort-Object FullName)
$referenceCount = 0
foreach ($file in $files) {
    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile(
        $file.FullName,
        [ref]$tokens,
        [ref]$parseErrors
    )
    Assert-Contract ($parseErrors.Count -eq 0) "Parser falhou em $($file.FullName)"

    $localFunctions = @{}
    foreach ($functionAst in $ast.FindAll({
        param($node)
        $node -is [System.Management.Automation.Language.FunctionDefinitionAst]
    }, $true)) {
        $localFunctions[$functionAst.Name] = $true
    }

    foreach ($commandAst in $ast.FindAll({
        param($node)
        $node -is [System.Management.Automation.Language.CommandAst]
    }, $true)) {
        $commandName = $commandAst.GetCommandName()
        if ([string]::IsNullOrWhiteSpace($commandName)) {
            continue
        }
        if ($commandName -notmatch '^(Assert|Convert|Get|Invoke|New|Remove|Start|Test|Write)-(Contabilidade|Startup)') {
            continue
        }

        $referenceCount++
        if (-not $localFunctions.ContainsKey($commandName) -and
            -not $exportedCommands.ContainsKey($commandName)) {
            throw "[STARTUP_POWERSHELL_CONTRACT] Comando de projeto nao resolvido: $commandName em $($file.FullName):$($commandAst.Extent.StartLineNumber)"
        }
    }
}

Write-Host "[OK] Contrato PowerShell: $($files.Count) arquivo(s), $referenceCount referencia(s) de projeto e quatro modulos validados." -ForegroundColor Green
