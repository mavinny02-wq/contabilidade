param(
    [ValidateSet('dev')]
    [string]$Mode = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PreflightModulePath = Join-Path $PSScriptRoot 'lib\startup-preflight.psm1'
$DockerModulePath = Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1'
$ProbeModulePath = Join-Path $PSScriptRoot 'lib\startup-probe.psm1'
$NativeProcessModulePath = Join-Path $PSScriptRoot 'lib\native-process.psm1'

# Only the parser module is imported before parse-all. Runtime modules are loaded
# after every operational ps1/psm1 has parsed successfully.
Import-Module $PreflightModulePath -Force -ErrorAction Stop

Write-Host '[STARTUP-PREFLIGHT] Validando sintaxe PowerShell antes de Maven, npm e Docker build...'
Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot

$requiredPaths = @(
    (Join-Path $ProjectDir 'START_CONTABILIDADE.bat'),
    (Join-Path $ProjectDir 'VERSION'),
    (Join-Path $ProjectDir '.env.example'),
    (Join-Path $ProjectDir 'compose.yaml'),
    (Join-Path $ProjectDir 'compose.dev.yaml'),
    $PreflightModulePath,
    $DockerModulePath,
    $ProbeModulePath,
    $NativeProcessModulePath,
    (Join-Path $PSScriptRoot 'start-contabilidade-resilient.ps1'),
    (Join-Path $PSScriptRoot 'start-contabilidade-core.bat'),
    (Join-Path $PSScriptRoot 'verify-runtime-images.ps1'),
    (Join-Path $PSScriptRoot 'start-compose-sequential.bat'),
    (Join-Path $PSScriptRoot 'start-compose-sequential.ps1'),
    (Join-Path $PSScriptRoot 'diagnostics\capture-docker-network-diagnostics.ps1')
)
foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "[STARTUP_PREFLIGHT_MISSING_FILE] Arquivo operacional ausente: $requiredPath"
    }
}

function Assert-StartupModuleContract {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$ModuleName,
        [Parameter(Mandatory = $true)][string[]]$RequiredCommands
    )

    $module = Get-Module -Name $ModuleName | Select-Object -Last 1
    if ($null -eq $module) {
        throw "[STARTUP_MODULE_CONTRACT] Modulo nao carregado: $ModuleName"
    }

    foreach ($commandName in $RequiredCommands) {
        if (-not $module.ExportedCommands.ContainsKey($commandName)) {
            throw "[STARTUP_MODULE_CONTRACT] $ModuleName nao exporta $commandName"
        }

        $visibleCommand = Get-Command -Name $commandName -ErrorAction SilentlyContinue |
            Where-Object { $_.Source -eq $ModuleName -or $_.ModuleName -eq $ModuleName } |
            Select-Object -First 1
        if ($null -eq $visibleCommand) {
            throw "[STARTUP_MODULE_CONTRACT] $commandName foi exportado por $ModuleName, mas nao esta visivel no entrypoint."
        }
    }
}

# Load in the same order used by the runtime entrypoints. startup-probe must not
# force-reload contabilidade-docker, otherwise Windows PowerShell 5.1 can remove
# the caller-visible Docker commands from the session state.
Import-Module $DockerModulePath -Force -ErrorAction Stop
Import-Module $ProbeModulePath -Force -ErrorAction Stop
Import-Module $NativeProcessModulePath -Force -ErrorAction Stop

Assert-StartupModuleContract -ModuleName 'contabilidade-docker' -RequiredCommands @(
    'Invoke-ContabilidadeNativeCommand',
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
Assert-StartupModuleContract -ModuleName 'startup-probe' -RequiredCommands @(
    'New-ContabilidadeStartupProbeResult',
    'Get-ContabilidadeStartupProbeState',
    'Remove-ContabilidadeStartupProbe',
    'Start-ContabilidadeStartupProbe',
    'Invoke-ContabilidadeStartupProbeRequest',
    'Invoke-ContabilidadeWithProbeCleanup'
)
Assert-StartupModuleContract -ModuleName 'native-process' -RequiredCommands @(
    'Invoke-NativeProcess',
    'Invoke-CmdCommand'
)
Write-Host '[OK] Contratos dos modulos de startup validados.' -ForegroundColor Green

Write-Host '[STARTUP-PREFLIGHT] Validando Docker CLI, daemon, Compose e Buildx...'
Assert-ContabilidadeDockerAvailable
$context = Get-ContabilidadeActiveDockerContext
Write-Host "[STARTUP-PREFLIGHT] Contexto Docker preservado: $context"

# PRIMA contract: preflight validates prerequisites and leaves application containers untouched.
# Probe lifecycle belongs exclusively to the sequential startup, after every build succeeded.
Write-Host '[STARTUP-PREFLIGHT] Read-only: nenhum container da aplicacao foi criado, inspecionado, parado ou removido.'
Write-Host '[STARTUP-PREFLIGHT] Concluido antes de qualquer build.' -ForegroundColor Green
