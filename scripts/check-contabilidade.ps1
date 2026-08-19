param(
    [switch]$SkipInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$LogDir = Join-Path $ProjectDir '.docker-local\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Import-Module (Join-Path $PSScriptRoot 'lib\startup-preflight.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\native-process.psm1') -Force

function Get-FirstCommandPath {
    param([string[]]$Names)
    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) { return $command.Source }
    }
    return $null
}

function Invoke-CheckStep {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$Arguments
    )
    $safeName = $Name -replace '[^A-Za-z0-9_.-]', '-'
    $logPath = Join-Path $LogDir ("CHECK_{0}_{1}.log" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $safeName)
    $commandLine = 'cd /d "' + $WorkingDirectory + '" && call "' + $Command + '" ' + $Arguments
    Write-Host "[CHECK] $Name"
    $result = Invoke-CmdCommand -CommandLine $commandLine -LogPath $logPath
    if (-not $result.Succeeded) {
        throw "$Name falhou. Exit code: $($result.ExitCode). Log: $logPath"
    }
    Write-Host "[OK] $Name" -ForegroundColor Green
}

try {
    Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot

    $javaHome = if (-not [string]::IsNullOrWhiteSpace($env:CONTABILIDADE_JAVA_HOME)) {
        $env:CONTABILIDADE_JAVA_HOME
    }
    elseif (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
        $env:JAVA_HOME
    }
    elseif (Test-Path -LiteralPath 'C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64') {
        'C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64'
    }
    else {
        $null
    }

    if ([string]::IsNullOrWhiteSpace($javaHome) -or
        -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\java.exe')) -or
        -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin\javac.exe'))) {
        throw 'JDK 21 completo nao encontrado. Defina CONTABILIDADE_JAVA_HOME para um JDK 21.'
    }
    $env:JAVA_HOME = $javaHome
    $env:Path = "$(Join-Path $javaHome 'bin');$env:Path"

    $maven = Get-FirstCommandPath @('mvn.cmd', 'mvn.exe', 'mvn')
    $node = Get-FirstCommandPath @('node.exe', 'node')
    $npm = Get-FirstCommandPath @('npm.cmd', 'npm.exe', 'npm')
    if (-not $maven) { throw 'Maven nao encontrado no PATH.' }
    if (-not $node) { throw 'Node.js nao encontrado no PATH.' }
    if (-not $npm) { throw 'npm nao encontrado no PATH.' }

    $javaVersion = Invoke-CmdCommand -CommandLine ('"' + (Join-Path $javaHome 'bin\java.exe') + '" -version') -LogPath (Join-Path $LogDir 'CHECK_JAVA_VERSION.log')
    if (-not $javaVersion.Succeeded -or $javaVersion.CombinedOutput -notmatch 'version\s+"21(?:\.|\")') {
        throw 'O check exige Java 21.'
    }
    $mavenVersion = Invoke-CmdCommand -CommandLine ('call "' + $maven + '" --version') -LogPath (Join-Path $LogDir 'CHECK_MAVEN_VERSION.log')
    if (-not $mavenVersion.Succeeded -or $mavenVersion.CombinedOutput -notmatch 'Java version:\s*21(?:\.|,)') {
        throw 'Maven nao esta usando Java 21.'
    }
    $nodeVersionResult = Invoke-CmdCommand -CommandLine ('"' + $node + '" -p "process.versions.node"') -LogPath (Join-Path $LogDir 'CHECK_NODE_VERSION.log')
    if (-not $nodeVersionResult.Succeeded) { throw 'Nao foi possivel consultar a versao do Node.js.' }
    $nodeVersion = [version]$nodeVersionResult.StdOut.Trim()
    if ($nodeVersion -lt [version]'22.12.0') { throw "Node.js 22.12+ exigido; encontrado $nodeVersion." }

    Invoke-CheckStep 'backend-test-compile' (Join-Path $ProjectDir 'backend') $maven '-B -DskipTests test-compile'

    if (-not $SkipInstall) {
        Invoke-CheckStep 'frontend-npm-ci' (Join-Path $ProjectDir 'frontend') $npm 'ci --prefer-offline --no-audit --no-fund'
    }
    Invoke-CheckStep 'frontend-i18n' (Join-Path $ProjectDir 'frontend') $npm 'run locale:validate'
    Invoke-CheckStep 'frontend-typecheck' (Join-Path $ProjectDir 'frontend') $npm 'run typecheck'
    Invoke-CheckStep 'frontend-build' (Join-Path $ProjectDir 'frontend') $npm 'run build'

    $oldSkipBrowser = $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
    $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
    try {
        if (-not $SkipInstall) {
            Invoke-CheckStep 'worker-npm-ci' (Join-Path $ProjectDir 'automation-worker') $npm 'ci --prefer-offline --no-audit --no-fund'
        }
        Invoke-CheckStep 'worker-typecheck' (Join-Path $ProjectDir 'automation-worker') $npm 'run typecheck'
        Invoke-CheckStep 'worker-build' (Join-Path $ProjectDir 'automation-worker') $npm 'run build'
    }
    finally {
        if ($null -eq $oldSkipBrowser) { Remove-Item Env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD -ErrorAction SilentlyContinue }
        else { $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = $oldSkipBrowser }
    }

    Write-Host '[CHECK] Backend, frontend e worker compilaram. Nenhum container foi iniciado ou alterado.' -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "[CHECK][FAIL] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
