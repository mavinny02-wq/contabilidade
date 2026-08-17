param(
    [ValidateSet('dev', 'onpremise')]
    [string]$Mode = 'dev'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$BackendDir = Join-Path $ProjectDir 'backend'
$FrontendDir = Join-Path $ProjectDir 'frontend'
$WorkerDir = Join-Path $ProjectDir 'automation-worker'
$LocalRoot = Join-Path $ProjectDir '.docker-local\artifact-build'
$LogDir = Join-Path $ProjectDir '.docker-local\logs'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogPath = Join-Path $LogDir "START_CONTABILIDADE_$Timestamp.log"
$LastLogPath = Join-Path $LogDir 'START_CONTABILIDADE_ultimo.log'

Import-Module (Join-Path $PSScriptRoot 'lib\startup-preflight.psm1') -Force
Invoke-StartupPowerShellPreflight -ScriptsPath $PSScriptRoot

New-Item -ItemType Directory -Force -Path $LocalRoot, $LogDir | Out-Null

function Write-Step {
    param([int]$Number, [int]$Total, [string]$Message)
    Write-Host ''
    Write-Host "[$Number/$Total] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[AVISO] $Message" -ForegroundColor Yellow
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$ErrorMessage = 'Comando externo falhou.',
        [string]$WorkingDirectory
    )

    if ($WorkingDirectory) {
        Push-Location $WorkingDirectory
    }
    try {
        & $FilePath @Arguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        if ($WorkingDirectory) {
            Pop-Location
        }
    }

    if ($exitCode -ne 0) {
        throw "$ErrorMessage Exit code: $exitCode."
    }
}

function Get-ExecutablePath {
    param([string[]]$Names)
    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) {
            return $command.Source
        }
    }
    return $null
}

function Test-Java21Home {
    param([string]$Candidate)
    if ([string]::IsNullOrWhiteSpace($Candidate)) {
        return $false
    }

    $expanded = [Environment]::ExpandEnvironmentVariables($Candidate.Trim('"'))
    $java = Join-Path $expanded 'bin\java.exe'
    $javac = Join-Path $expanded 'bin\javac.exe'
    if (-not (Test-Path -LiteralPath $java) -or -not (Test-Path -LiteralPath $javac)) {
        return $false
    }

    $versionOutput = (& $java -version 2>&1 | Out-String)
    return $LASTEXITCODE -eq 0 -and $versionOutput -match 'version\s+"21(?:\.|\")'
}

function Find-Java21Home {
    $candidates = New-Object System.Collections.Generic.List[string]

    foreach ($candidate in @(
        $env:CONTABILIDADE_JAVA_HOME,
        'C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64',
        $env:JAVA_HOME
    )) {
        if (-not [string]::IsNullOrWhiteSpace($candidate)) {
            $candidates.Add($candidate)
        }
    }

    $searchRoots = @(
        (Join-Path $env:ProgramFiles 'Eclipse Adoptium'),
        (Join-Path $env:ProgramFiles 'Java'),
        (Join-Path $env:ProgramFiles 'Microsoft'),
        (Join-Path $env:ProgramFiles 'Amazon Corretto'),
        (Join-Path $env:ProgramFiles 'Zulu'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Eclipse Adoptium'),
        (Join-Path $env:USERPROFILE '.jdks')
    )

    foreach ($root in $searchRoots) {
        if (Test-Path -LiteralPath $root) {
            Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match '21' } |
                Sort-Object Name -Descending |
                ForEach-Object { $candidates.Add($_.FullName) }
        }
    }

    $whereJava = & where.exe java 2>$null
    foreach ($javaPath in $whereJava) {
        if (-not [string]::IsNullOrWhiteSpace($javaPath)) {
            $binDirectory = Split-Path -Parent $javaPath
            # $HOME e uma variavel automatica somente leitura do PowerShell.
            # Use um nome especifico para nao tentar sobrescreve-la.
            $javaHomeCandidate = Split-Path -Parent $binDirectory
            $candidates.Add($javaHomeCandidate)
        }
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (Test-Java21Home $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw @"
JDK 21 nao encontrado.
O Java 17 do Windows pode continuar instalado, mas este projeto precisa de um JDK 21 para o build local.

Caminho usado pelo PRIMA nesta maquina:
C:\work\java\zulu21.44.17-ca-jdk21.0.8-win_x64

Opcoes:
1. confirme que esse diretorio existe; ou
2. defina CONTABILIDADE_JAVA_HOME para o seu JDK 21; ou
3. instale Temurin 21: winget install EclipseAdoptium.Temurin.21.JDK
"@
}

function Find-NodeHome {
    $candidateCommands = @()
    $current = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($current) {
        $candidateCommands += $current.Source
    }

    $nvmRoots = @(
        (Join-Path $env:APPDATA 'nvm'),
        (Join-Path $env:LOCALAPPDATA 'nvm')
    )
    foreach ($root in $nvmRoots) {
        if (Test-Path -LiteralPath $root) {
            Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -match '^v?22\.' } |
                Sort-Object Name -Descending |
                ForEach-Object {
                    $node = Join-Path $_.FullName 'node.exe'
                    if (Test-Path -LiteralPath $node) {
                        $candidateCommands += $node
                    }
                }
        }
    }

    $programNode = Join-Path $env:ProgramFiles 'nodejs\node.exe'
    if (Test-Path -LiteralPath $programNode) {
        $candidateCommands += $programNode
    }

    foreach ($node in ($candidateCommands | Select-Object -Unique)) {
        $versionText = (& $node -p 'process.versions.node' 2>$null | Out-String).Trim()
        if ($LASTEXITCODE -eq 0 -and $versionText) {
            try {
                if ([version]$versionText -ge [version]'22.12.0') {
                    return Split-Path -Parent $node
                }
            }
            catch {
                continue
            }
        }
    }

    throw @"
Node.js 22.12 ou superior nao encontrado.
Instale uma versao LTS atual ou defina o PATH para ela.
Comando sugerido: winget install OpenJS.NodeJS.LTS
"@
}

function Get-CombinedFileHash {
    param([string[]]$Paths)
    $existing = $Paths | Where-Object { Test-Path -LiteralPath $_ }
    if (-not $existing) {
        throw 'Nenhum arquivo encontrado para calcular o hash de dependencias.'
    }
    $value = ($existing | ForEach-Object {
        (Get-FileHash -Algorithm SHA256 -LiteralPath $_).Hash
    }) -join '|'
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes($value)
        return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

function Ensure-NodeDependencies {
    param(
        [string]$Directory,
        [string]$HashFile,
        [string]$DisplayName,
        [switch]$SkipPlaywrightBrowserDownload
    )

    $packageJson = Join-Path $Directory 'package.json'
    $packageLock = Join-Path $Directory 'package-lock.json'
    $nodeModules = Join-Path $Directory 'node_modules'
    $currentHash = Get-CombinedFileHash @($packageJson, $packageLock)
    $cachedHash = if (Test-Path -LiteralPath $HashFile) {
        (Get-Content -LiteralPath $HashFile -Raw).Trim()
    }
    else {
        ''
    }

    if ((Test-Path -LiteralPath $nodeModules) -and $currentHash -eq $cachedHash) {
        Write-Ok "Reutilizando node_modules do $DisplayName."
        return
    }

    Push-Location $Directory
    $oldSkip = $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
    try {
        if ($SkipPlaywrightBrowserDownload) {
            $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
        }
        if (Test-Path -LiteralPath $packageLock) {
            Invoke-Checked $script:NpmCommand @('ci', '--prefer-offline', '--no-audit', '--no-fund') "Falha ao instalar dependencias do $DisplayName."
        }
        else {
            Write-Warn "$DisplayName nao possui package-lock.json; npm install sera usado e gerara o lockfile."
            Invoke-Checked $script:NpmCommand @('install', '--prefer-offline', '--no-audit', '--no-fund') "Falha ao instalar dependencias do $DisplayName."
        }
    }
    finally {
        if ($null -eq $oldSkip) {
            Remove-Item Env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD -ErrorAction SilentlyContinue
        }
        else {
            $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = $oldSkip
        }
        Pop-Location
    }

    $newHash = Get-CombinedFileHash @($packageJson, $packageLock)
    Set-Content -LiteralPath $HashFile -Value $newHash -Encoding ASCII
}

function Write-Utf8NoBomLf {
    param([string]$Path, [string]$Content)
    $normalized = $Content.Replace("`r`n", "`n").Replace("`r", "`n")
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($Path, $normalized, $encoding)
}

function Invoke-Compose {
    param([string[]]$Arguments, [switch]$AllowFailure)
    $prefix = $script:ComposePrefix
    & $script:DockerCommand @prefix @Arguments
    $exitCode = $LASTEXITCODE
    if (-not $AllowFailure -and $exitCode -ne 0) {
        throw "Docker Compose falhou. Exit code: $exitCode."
    }
    return $exitCode
}

function Wait-Until {
    param(
        [scriptblock]$Condition,
        [int]$TimeoutSeconds,
        [string]$Description
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            if (& $Condition) {
                Write-Ok $Description
                return
            }
        }
        catch {
            # Continua aguardando; o erro final sera exibido se o timeout expirar.
        }
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $deadline)

    throw "Tempo esgotado aguardando: $Description"
}

$exitCode = 1
$transcriptStarted = $false
try {
    try {
        Start-Transcript -Path $LogPath -Force | Out-Null
        $transcriptStarted = $true
    }
    catch {
        Write-Warn "Nao foi possivel iniciar o transcript. A saida continuara visivel na tela."
    }
    Write-Host '============================================================' -ForegroundColor DarkCyan
    Write-Host 'CONTABILIDADE - BUILD LOCAL NO MODELO DO PRIMA' -ForegroundColor Cyan
    Write-Host '============================================================' -ForegroundColor DarkCyan
    Write-Host "Projeto: $ProjectDir"
    Write-Host "Modo:    $Mode"
    Write-Host "Log:     $LogPath"

    Write-Step 1 7 'Validando ambiente e projeto'
    Set-Location $ProjectDir

    $requiredFiles = @(
        'VERSION',
        'backend\pom.xml',
        'frontend\package.json',
        'frontend\nginx.conf',
        'frontend\docker-entrypoint.d\40-runtime-config.sh',
        'automation-worker\package.json',
        'compose.yaml',
        'compose.dev.yaml',
        'compose.onpremise.yaml',
        'infra\keycloak\realm-contabilidade-dev.json',
        'infra\keycloak\realm-contabilidade.json',
        'infra\playwright\seccomp_profile.json'
    )
    foreach ($relative in $requiredFiles) {
        $absolute = Join-Path $ProjectDir $relative
        if (-not (Test-Path -LiteralPath $absolute)) {
            throw "Arquivo obrigatorio ausente: $absolute"
        }
    }

    $version = (Get-Content -LiteralPath (Join-Path $ProjectDir 'VERSION') -Raw).Trim()
    if (-not $version) {
        throw 'Arquivo VERSION vazio.'
    }

    $javaHome = Find-Java21Home
    $env:JAVA_HOME = $javaHome
    $env:Path = "$javaHome\bin;$env:Path"

    $nodeHome = Find-NodeHome
    $env:Path = "$nodeHome;$env:Path"

    $script:MavenCommand = Get-ExecutablePath @('mvn.cmd', 'mvn.exe', 'mvn')
    $script:NpmCommand = Get-ExecutablePath @('npm.cmd', 'npm.exe', 'npm')
    $script:DockerCommand = Get-ExecutablePath @('docker.exe', 'docker')

    if (-not $script:MavenCommand) { throw 'Maven nao encontrado no PATH.' }
    if (-not $script:NpmCommand) { throw 'npm nao encontrado no PATH selecionado.' }
    if (-not $script:DockerCommand) { throw 'Docker CLI nao encontrado.' }

    $javaOutput = (& (Join-Path $javaHome 'bin\java.exe') -version 2>&1 | Out-String)
    Write-Host $javaOutput.TrimEnd()

    $mavenOutput = (& $script:MavenCommand --version 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel executar mvn --version.' }
    Write-Host $mavenOutput.TrimEnd()
    if ($mavenOutput -notmatch 'Java version:\s*21(?:\.|,)') {
        throw "Maven nao esta usando Java 21. JAVA_HOME selecionado: $javaHome"
    }

    $nodeVersion = (& (Join-Path $nodeHome 'node.exe') -p 'process.versions.node' 2>&1 | Out-String).Trim()
    Write-Host "Node: $nodeVersion"
    Write-Host "npm:  $(& $script:NpmCommand --version)"

    Invoke-Checked $script:DockerCommand @('info') 'Docker Desktop nao esta em execucao.'
    Invoke-Checked $script:DockerCommand @('compose', 'version') 'Docker Compose v2 nao encontrado.'

    $envFile = Join-Path $ProjectDir '.env'
    $envExample = Join-Path $ProjectDir '.env.example'
    if (-not (Test-Path -LiteralPath $envFile)) {
        if ($Mode -eq 'onpremise') {
            throw '.env ausente. Crie e revise o arquivo antes de usar o modo onpremise.'
        }
        Copy-Item -LiteralPath $envExample -Destination $envFile
        Write-Warn '.env de desenvolvimento criado a partir de .env.example.'
    }

    if ($Mode -eq 'onpremise') {
        $envText = Get-Content -LiteralPath $envFile -Raw
        if ($envText -match 'altere-esta-senha|altere-este-token|altere-este-segredo') {
            throw 'Modo onpremise recusado: .env ainda contem segredos de exemplo.'
        }
    }

    $modeCompose = Join-Path $ProjectDir $(if ($Mode -eq 'dev') { 'compose.dev.yaml' } else { 'compose.onpremise.yaml' })
    $composeBase = Join-Path $ProjectDir 'compose.yaml'
    $composeOverride = Join-Path $LocalRoot 'compose.local-artifacts.yaml'
    $script:ComposePrefix = @('compose', '--env-file', $envFile, '-f', $composeBase, '-f', $modeCompose, '-f', $composeOverride)

    & $script:DockerCommand compose --env-file $envFile -f $composeBase -f $modeCompose config --quiet
    if ($LASTEXITCODE -ne 0) {
        throw "Compose base do modo $Mode invalido."
    }
    Write-Ok "Preflight concluido. Versao da aplicacao: $version"
    Write-Host 'Containers existentes ainda nao foram alterados.' -ForegroundColor Yellow

    Write-Step 2 7 'Compilando backend localmente com Maven'
    Invoke-Checked $script:MavenCommand @('-B', 'clean', 'package', '-DskipTests') 'Build Maven local falhou.' $BackendDir

    $targetDir = Join-Path $BackendDir 'target'
    $jar = Get-ChildItem -LiteralPath $targetDir -File -Filter '*.jar' |
        Where-Object { $_.Name -notmatch '^(original-|.*-(sources|javadoc)\.jar$)' } |
        Sort-Object Length -Descending |
        Select-Object -First 1
    if (-not $jar) {
        throw "JAR executavel nao encontrado em $targetDir"
    }
    $preparedJar = Join-Path $targetDir 'contabilidade-local-backend.jar'
    Copy-Item -LiteralPath $jar.FullName -Destination $preparedJar -Force
    Write-Ok "Backend compilado: $preparedJar"

    Write-Step 3 7 'Compilando frontend localmente com npm'
    $frontendHash = Join-Path $LocalRoot 'frontend-deps.sha256'
    Ensure-NodeDependencies $FrontendDir $frontendHash 'frontend'
    Invoke-Checked $script:NpmCommand @('run', 'locale:validate') 'Validacao i18n do frontend falhou.' $FrontendDir
    Invoke-Checked $script:NpmCommand @('run', 'typecheck') 'Typecheck do frontend falhou.' $FrontendDir
    Invoke-Checked $script:NpmCommand @('run', 'build') 'Build do frontend falhou.' $FrontendDir
    $frontendDist = Join-Path $FrontendDir 'dist\index.html'
    if (-not (Test-Path -LiteralPath $frontendDist)) {
        throw 'frontend\dist\index.html nao foi gerado.'
    }
    Write-Ok 'Frontend compilado.'

    Write-Step 4 7 'Compilando automation worker localmente com npm'
    $workerHash = Join-Path $LocalRoot 'worker-deps.sha256'
    Ensure-NodeDependencies $WorkerDir $workerHash 'automation worker' -SkipPlaywrightBrowserDownload
    Invoke-Checked $script:NpmCommand @('run', 'typecheck') 'Typecheck do worker falhou.' $WorkerDir
    Invoke-Checked $script:NpmCommand @('run', 'build') 'Build do worker falhou.' $WorkerDir
    $workerDist = Join-Path $WorkerDir 'dist\index.js'
    if (-not (Test-Path -LiteralPath $workerDist)) {
        throw 'automation-worker\dist\index.js nao foi gerado.'
    }

    $workerProduction = Join-Path $LocalRoot 'worker-production'
    if (Test-Path -LiteralPath $workerProduction) {
        Remove-Item -LiteralPath $workerProduction -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $workerProduction | Out-Null
    Copy-Item -LiteralPath (Join-Path $WorkerDir 'package.json') -Destination $workerProduction
    $workerLock = Join-Path $WorkerDir 'package-lock.json'
    if (Test-Path -LiteralPath $workerLock) {
        Copy-Item -LiteralPath $workerLock -Destination $workerProduction
    }

    $oldSkip = $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
    $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
    try {
        if (Test-Path -LiteralPath (Join-Path $workerProduction 'package-lock.json')) {
            Invoke-Checked $script:NpmCommand @('ci', '--prefix', $workerProduction, '--omit=dev', '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund') 'Falha ao preparar dependencias de producao do worker.'
        }
        else {
            Invoke-Checked $script:NpmCommand @('install', '--prefix', $workerProduction, '--omit=dev', '--prefer-offline', '--ignore-scripts', '--no-audit', '--no-fund') 'Falha ao preparar dependencias de producao do worker.'
        }
    }
    finally {
        if ($null -eq $oldSkip) {
            Remove-Item Env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD -ErrorAction SilentlyContinue
        }
        else {
            $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = $oldSkip
        }
    }
    Write-Ok 'Automation worker compilado.'

    Write-Step 5 7 'Preparando contextos Docker somente com artefatos'
    $backendContext = Join-Path $LocalRoot 'backend-context'
    $frontendContext = Join-Path $LocalRoot 'frontend-context'
    $workerContext = Join-Path $LocalRoot 'worker-context'

    foreach ($directory in @($backendContext, $frontendContext, $workerContext)) {
        if (Test-Path -LiteralPath $directory) {
            Remove-Item -LiteralPath $directory -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path $directory | Out-Null
    }
    New-Item -ItemType Directory -Force -Path (Join-Path $frontendContext 'dist') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $frontendContext 'docker-entrypoint.d') | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $workerContext 'dist') | Out-Null

    Copy-Item -LiteralPath $preparedJar -Destination (Join-Path $backendContext 'app.jar')
    Copy-Item -Path (Join-Path $FrontendDir 'dist\*') -Destination (Join-Path $frontendContext 'dist') -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $FrontendDir 'nginx.conf') -Destination $frontendContext

    $entrypointSource = Join-Path $FrontendDir 'docker-entrypoint.d\40-runtime-config.sh'
    $entrypointTarget = Join-Path $frontendContext 'docker-entrypoint.d\40-runtime-config.sh'
    Write-Utf8NoBomLf $entrypointTarget (Get-Content -LiteralPath $entrypointSource -Raw)

    Copy-Item -Path (Join-Path $WorkerDir 'dist\*') -Destination (Join-Path $workerContext 'dist') -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $WorkerDir 'package.json') -Destination $workerContext
    Copy-Item -LiteralPath (Join-Path $workerProduction 'node_modules') -Destination $workerContext -Recurse -Force

    Write-Utf8NoBomLf (Join-Path $backendContext 'Dockerfile') @'
FROM eclipse-temurin:21-jre
LABEL contabilidade.local.artifact-only="true"
WORKDIR /app
COPY app.jar /app/app.jar
EXPOSE 8080
USER 10001
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75.0","-jar","/app/app.jar"]
'@

    Write-Utf8NoBomLf (Join-Path $frontendContext 'Dockerfile') @'
FROM nginx:1.27-alpine
LABEL contabilidade.local.artifact-only="true"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
COPY dist/ /usr/share/nginx/html/
EXPOSE 8080
'@

    Write-Utf8NoBomLf (Join-Path $workerContext 'Dockerfile') @'
FROM mcr.microsoft.com/playwright:v1.60.0-noble
LABEL contabilidade.local.artifact-only="true"
WORKDIR /app
COPY --chown=pwuser:pwuser package.json /app/package.json
COPY --chown=pwuser:pwuser dist/ /app/dist/
COPY --chown=pwuser:pwuser node_modules/ /app/node_modules/
ENV NODE_ENV=production
EXPOSE 3001
USER pwuser
ENTRYPOINT ["node","dist/index.js"]
'@

    $backendImage = "contabilidade-backend:$version"
    $frontendImage = "contabilidade-frontend:$version"
    $workerImage = "contabilidade-automation-worker:$version"

    $overrideContent = @"
services:
  backend:
    image: $backendImage
    build: null
    healthcheck:
      test: ["CMD-SHELL", "test -f /app/app.jar"]
      interval: 5s
      timeout: 3s
      retries: 20
  frontend:
    image: $frontendImage
    build: null
  automation-worker:
    image: $workerImage
    build: null
"@
    Write-Utf8NoBomLf $composeOverride $overrideContent

    $script:ComposePrefix = @('compose', '--env-file', $envFile, '-f', $composeBase, '-f', $modeCompose, '-f', $composeOverride)
    Invoke-Compose @('config', '--quiet') | Out-Null
    Write-Ok 'Contextos runtime-only preparados.'

    Write-Step 6 7 'Criando imagens Docker runtime-only'
    foreach ($build in @(
        @{ Name = 'backend'; Tag = $backendImage; Context = $backendContext },
        @{ Name = 'frontend'; Tag = $frontendImage; Context = $frontendContext },
        @{ Name = 'worker'; Tag = $workerImage; Context = $workerContext }
    )) {
        Write-Host "Construindo imagem $($build.Tag)..."
        $tag = [string]$build.Tag
        $context = [string]$build.Context
        Invoke-Checked $script:DockerCommand @('build', '--pull=false', '--network=none', '--progress=plain', '-t', $tag, $context) "Falha ao construir imagem $($build.Name)."
        $label = (& $script:DockerCommand image inspect $tag --format '{{ index .Config.Labels "contabilidade.local.artifact-only" }}' 2>$null | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or $label -ne 'true') {
            throw "Imagem $($build.Tag) nao possui o label artifact-only esperado."
        }
    }

    Invoke-Checked $script:DockerCommand @('run', '--rm', '--entrypoint', '/bin/sh', $backendImage, '-c', 'test -f /app/app.jar && test ! -f /app/pom.xml') 'Imagem runtime do backend invalida.'
    Invoke-Checked $script:DockerCommand @('run', '--rm', $frontendImage, 'nginx', '-t') 'Configuracao Nginx da imagem frontend invalida.'
    Invoke-Checked $script:DockerCommand @('run', '--rm', '--entrypoint', '/bin/sh', $workerImage, '-c', 'test -f /app/dist/index.js && test -d /app/node_modules/playwright && test ! -d /app/src') 'Imagem runtime do worker invalida.'
    Write-Ok 'As tres imagens runtime foram verificadas.'

    Write-Step 7 7 'Reiniciando a stack somente agora'
    Invoke-Compose @('down') | Out-Null
    Invoke-Compose @('up', '--no-build', '-d') | Out-Null

    Wait-Until -TimeoutSeconds 180 -Description 'PostgreSQL, Keycloak, backend, worker e frontend em execucao' -Condition {
        foreach ($service in @('postgres', 'keycloak', 'backend', 'automation-worker', 'frontend')) {
            $prefix = $script:ComposePrefix
            $output = (& $script:DockerCommand @prefix ps --status running $service 2>$null | Out-String)
            if ($LASTEXITCODE -ne 0 -or $output -notmatch [regex]::Escape($service)) {
                return $false
            }
        }
        return $true
    }

    Invoke-Compose @('exec', '-T', 'frontend', 'nginx', '-t') | Out-Null

    Wait-Until -TimeoutSeconds 180 -Description 'Backend readiness' -Condition {
        $prefix = $script:ComposePrefix
        & $script:DockerCommand @prefix exec -T frontend wget -qO- http://backend:8080/actuator/health/readiness *> $null
        return $LASTEXITCODE -eq 0
    }

    Wait-Until -TimeoutSeconds 120 -Description 'Automation worker health' -Condition {
        $prefix = $script:ComposePrefix
        & $script:DockerCommand @prefix exec -T automation-worker node -e "fetch('http://localhost:3001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" *> $null
        return $LASTEXITCODE -eq 0
    }

    Wait-Until -TimeoutSeconds 120 -Description 'Keycloak realm disponivel' -Condition {
        $prefix = $script:ComposePrefix
        & $script:DockerCommand @prefix exec -T frontend wget -qO- http://keycloak:8080/auth/realms/contabilidade/.well-known/openid-configuration *> $null
        return $LASTEXITCODE -eq 0
    }

    Wait-Until -TimeoutSeconds 120 -Description 'Frontend healthz' -Condition {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 'http://localhost:8088/healthz'
        return $response.StatusCode -eq 200
    }

    $prefix = $script:ComposePrefix
    & $script:DockerCommand @prefix ps

    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host 'SUCESSO' -ForegroundColor Green
    Write-Host '============================================================' -ForegroundColor Green
    Write-Host "Java 21: $javaHome"
    Write-Host "Backend: $backendImage"
    Write-Host "Frontend: $frontendImage"
    Write-Host "Worker:   $workerImage"
    Write-Host 'Aplicacao: http://localhost:8088'
    Write-Host 'Maven e npm foram executados no Windows. Docker recebeu artefatos prontos.'

    Start-Process 'http://localhost:8088'
    $exitCode = 0
}
catch {
    Write-Host ''
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host 'FALHA' -ForegroundColor Red
    Write-Host '============================================================' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ScriptStackTrace) {
        Write-Host ''
        Write-Host 'Local da falha:' -ForegroundColor Yellow
        Write-Host $_.ScriptStackTrace
    }
    Write-Host ''
    Write-Host "Log completo: $LogPath" -ForegroundColor Yellow
    Write-Host 'Nenhum fluxo fiscal externo ou pago foi executado por este script.'
}
finally {
    if ($transcriptStarted) {
        try {
            Stop-Transcript | Out-Null
        }
        catch {
            # Nao mascara o erro original.
        }
    }
    if (Test-Path -LiteralPath $LogPath) {
        Copy-Item -LiteralPath $LogPath -Destination $LastLogPath -Force
    }
}

exit $exitCode
