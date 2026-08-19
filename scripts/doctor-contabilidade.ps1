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

function Get-FirstCommandPath {
    param([string[]]$Names)
    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) { return $command.Source }
    }
    return $null
}

try {
    Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot
    Write-DoctorResult 'POWERSHELL' 'PASS' 'Todos os scripts PowerShell parsearam.'

    Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force

    $javaHome = if (-not [string]::IsNullOrWhiteSpace($env:CONTABILIDADE_JAVA_HOME)) {
        $env:CONTABILIDADE_JAVA_HOME
    }
    elseif (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
        $env:JAVA_HOME
    }
    elseif (Test-Path -LiteralPath 'C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64') {
        'C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64'
    }
    else { $null }

    if ([string]::IsNullOrWhiteSpace($javaHome) -or
        -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe')) -or
        -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\javac.exe'))) {
        throw 'JDK 21 completo nao encontrado. Defina CONTABILIDADE_JAVA_HOME.'
    }
    $env:JAVA_HOME = $javaHome
    $env:Path = "$(Join-Path $javaHome 'bin');$env:Path"

    $javaCommand = Join-Path $javaHome 'bin\java.exe'
    $mavenCommand = Get-FirstCommandPath @('mvn.cmd', 'mvn.exe', 'mvn')
    $nodeCommand = Get-FirstCommandPath @('node.exe', 'node')
    $npmCommand = Get-FirstCommandPath @('npm.cmd', 'npm.exe', 'npm')
    if (-not $mavenCommand) { throw 'Maven nao encontrado no PATH.' }
    if (-not $nodeCommand) { throw 'Node.js nao encontrado no PATH.' }
    if (-not $npmCommand) { throw 'npm nao encontrado no PATH.' }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI nao encontrado no PATH.' }

    $java = Invoke-ContabilidadeNativeCommand -FilePath $javaCommand -Arguments @('-version')
    if (-not $java.Success -or $java.Output -notmatch 'version\s+"21(?:\.|\")') { throw 'Java 21 nao esta ativo.' }
    Write-DoctorResult 'JAVA' 'PASS' "Java 21 ativo em $javaHome."

    $maven = Invoke-ContabilidadeNativeCommand -FilePath $mavenCommand -Arguments @('--version')
    if (-not $maven.Success -or $maven.Output -notmatch 'Java version:\s*21(?:\.|,)') { throw 'Maven nao esta usando Java 21.' }
    Write-DoctorResult 'MAVEN' 'PASS' 'Maven usa Java 21.'

    $node = Invoke-ContabilidadeNativeCommand -FilePath $nodeCommand -Arguments @('-p', 'process.versions.node')
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
    else { Write-DoctorResult 'ENV' 'PASS' '.env presente; conteudo nao foi exibido.' }

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
