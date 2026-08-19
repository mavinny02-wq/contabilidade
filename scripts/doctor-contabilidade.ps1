param(
    [ValidateSet('dev', 'onpremise')]
    [string]$Mode = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Import-Module (Join-Path $PSScriptRoot 'lib\startup-preflight.psm1') -Force

function Write-DoctorResult {
    param([string]$Category, [string]$Status, [string]$Message)
    $color = if ($Status -eq 'PASS') { 'Green' } elseif ($Status -eq 'WARN') { 'Yellow' } else { 'Red' }
    Write-Host "[DOCTOR][$Category][$Status] $Message" -ForegroundColor $color
}

try {
    Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot
    Write-DoctorResult 'POWERSHELL' 'PASS' 'Todos os scripts PowerShell parsearam.'

    Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force

    foreach ($command in @('java', 'javac', 'mvn', 'node', 'npm', 'docker')) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "Comando ausente no PATH: $command"
        }
    }

    $java = Invoke-ContabilidadeNativeCommand -FilePath 'java' -Arguments @('-version')
    if (-not $java.Success -or $java.Output -notmatch 'version\s+"21(?:\.|\")') { throw 'Java 21 nao esta ativo no PATH.' }
    Write-DoctorResult 'JAVA' 'PASS' 'Java 21 ativo.'

    $maven = Invoke-ContabilidadeNativeCommand -FilePath 'mvn' -Arguments @('--version')
    if (-not $maven.Success -or $maven.Output -notmatch 'Java version:\s*21(?:\.|,)') { throw 'Maven nao esta usando Java 21.' }
    Write-DoctorResult 'MAVEN' 'PASS' 'Maven usa Java 21.'

    $node = Invoke-ContabilidadeNativeCommand -FilePath 'node' -Arguments @('-p', 'process.versions.node')
    if (-not $node.Success) { throw 'Nao foi possivel consultar Node.js.' }
    $nodeVersion = [version]$node.StdOut.Trim()
    if ($nodeVersion -lt [version]'22.12.0') { throw "Node.js 22.12+ exigido; encontrado $nodeVersion." }
    Write-DoctorResult 'NODE' 'PASS' "Node $nodeVersion."

    Assert-ContabilidadeDockerAvailable
    $context = Get-ContabilidadeActiveDockerContext
    Write-DoctorResult 'DOCKER' 'PASS' "Daemon, Compose e Buildx disponiveis; contexto preservado: $context."

    $envFile = Join-Path $ProjectDir '.env'
    if (-not (Test-Path -LiteralPath $envFile)) {
        $envFile = Join-Path $ProjectDir '.env.example'
        Write-DoctorResult 'ENV' 'WARN' '.env ausente; validando Compose com .env.example sem criar arquivo.'
    }
    else {
        Write-DoctorResult 'ENV' 'PASS' '.env presente; conteudo nao foi exibido.'
    }

    $modeFile = Join-Path $ProjectDir $(if ($Mode -eq 'dev') { 'compose.dev.yaml' } else { 'compose.onpremise.yaml' })
    $overrideFile = Join-Path $ProjectDir '.docker-local\artifact-build\compose.local-artifacts.yaml'
    if (-not (Test-Path -LiteralPath $overrideFile)) {
        throw 'Override de artefatos ausente. Execute START_CONTABILIDADE.bat build antes de start.'
    }

    $composeArguments = @(
        'compose', '--env-file', $envFile,
        '-f', (Join-Path $ProjectDir 'compose.yaml'),
        '-f', $modeFile,
        '-f', $overrideFile,
        'config', '--quiet'
    )
    $compose = Invoke-ContabilidadeDocker -Arguments $composeArguments -AllowFailure -Quiet
    if (-not $compose.Success) { throw "Compose efetivo invalido. Exit code: $($compose.ExitCode)." }
    Write-DoctorResult 'COMPOSE' 'PASS' "Configuracao efetiva do modo $Mode valida."

    $versionFile = Join-Path $ProjectDir 'VERSION'
    if (-not (Test-Path -LiteralPath $versionFile)) { throw 'Arquivo VERSION ausente.' }
    $version = (Get-Content -LiteralPath $versionFile -Raw).Trim()
    $missing = @()
    foreach ($image in @(
        "contabilidade-backend:$version",
        "contabilidade-frontend:$version",
        "contabilidade-automation-worker:$version"
    )) {
        $inspect = Invoke-ContabilidadeDocker -Arguments @('image', 'inspect', $image) -AllowFailure -Quiet
        if ($inspect.Success) { Write-DoctorResult 'IMAGE' 'PASS' "$image presente." }
        else { $missing += $image; Write-DoctorResult 'IMAGE' 'FAIL' "$image ausente ou inacessivel." }
    }
    if ($missing.Count -gt 0) {
        throw "Imagens runtime faltantes: $($missing -join ', '). Execute START_CONTABILIDADE.bat build."
    }

    Write-Host '[DOCTOR] Ambiente pronto para START_CONTABILIDADE.bat start. Nenhum build, start, pull, cleanup ou troca de contexto foi executado.' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "[DOCTOR][FAIL] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
