param(
    [ValidateSet('dev')]
    [string]$Mode = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Only the parser module is imported before parse-all. Docker/probe modules are
# imported after every operational ps1/psm1 has been parsed successfully.
Import-Module (Join-Path $PSScriptRoot 'lib\startup-preflight.psm1') -Force

Write-Host '[STARTUP-PREFLIGHT] Validando sintaxe PowerShell antes de Maven, npm e Docker build...'
Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot

foreach ($requiredPath in @(
    (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1'),
    (Join-Path $PSScriptRoot 'lib\startup-probe.psm1'),
    (Join-Path $PSScriptRoot 'verify-runtime-images.ps1'),
    (Join-Path $PSScriptRoot 'start-compose-sequential.bat'),
    (Join-Path $PSScriptRoot 'start-compose-sequential.ps1')
)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "[STARTUP_PREFLIGHT_MISSING_FILE] Arquivo operacional ausente: $requiredPath"
    }
}

Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\startup-probe.psm1') -Force

Write-Host '[STARTUP-PREFLIGHT] Validando Docker CLI, daemon, Compose e Buildx...'
Assert-ContabilidadeDockerAvailable
$context = Get-ContabilidadeActiveDockerContext
Write-Host "[STARTUP-PREFLIGHT] Contexto Docker preservado: $context"

$cleanup = Remove-ContabilidadeStartupProbe
Write-Host "[STARTUP-PREFLIGHT][PROBE] category=$($cleanup.Category) exit=$($cleanup.ExitCode) status=$($cleanup.Status)"
Write-Host '[STARTUP-PREFLIGHT] Concluido antes de qualquer build.' -ForegroundColor Green
