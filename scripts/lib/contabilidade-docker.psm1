Set-StrictMode -Version Latest

function Invoke-ContabilidadeNativeCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $stdoutPath = [IO.Path]::GetTempFileName()
    $stderrPath = [IO.Path]::GetTempFileName()
    $previousErrorActionPreference = $ErrorActionPreference

    try {
        # Windows PowerShell 5.1 can turn native stderr into NativeCommandError when
        # the caller uses Stop. Redirect both streams while the process runs, then
        # make the native exit code the sole command-success authority.
        $ErrorActionPreference = 'Continue'
        & $FilePath @Arguments 1> $stdoutPath 2> $stderrPath
        $exitCode = $LASTEXITCODE

        $stdout = [IO.File]::ReadAllText($stdoutPath)
        $stderr = [IO.File]::ReadAllText($stderrPath)
        $combined = ($stdout + $stderr)

        return [pscustomobject]@{
            ExitCode = $exitCode
            StdOut = $stdout
            StdErr = $stderr
            Output = $combined
            Success = ($exitCode -eq 0)
        }
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Remove-Item -LiteralPath $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
    }
}

function Write-ContabilidadeNativeOutput {
    param([Parameter(Mandatory = $true)]$Result)

    if (-not [string]::IsNullOrWhiteSpace($Result.StdOut)) {
        Write-Host $Result.StdOut.TrimEnd()
    }
    if (-not [string]::IsNullOrWhiteSpace($Result.StdErr)) {
        Write-Warning $Result.StdErr.TrimEnd()
    }
}

function Invoke-ContabilidadeDocker {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    $result = Invoke-ContabilidadeNativeCommand -FilePath 'docker' -Arguments $Arguments
    if (-not $Quiet) {
        Write-ContabilidadeNativeOutput -Result $result
    }
    if (-not $AllowFailure -and -not $result.Success) {
        throw "Docker falhou: docker $($Arguments -join ' '). Exit code: $($result.ExitCode)."
    }
    return $result
}

function Assert-ContabilidadeDockerAvailable {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI nao encontrado. Instale ou repare o Docker Desktop e confirme que docker.exe esta no PATH.'
    }

    Write-Host '[INFO] Verificando Docker daemon...'
    $info = Invoke-ContabilidadeDocker -Arguments @('info') -AllowFailure
    if (-not $info.Success) {
        throw "Docker CLI encontrado, mas o daemon nao esta acessivel. Inicie o Docker Desktop e tente novamente. Exit code: $($info.ExitCode)."
    }
    Write-Host '[OK] Docker daemon disponivel.' -ForegroundColor Green

    Write-Host '[INFO] Verificando Docker Buildx...'
    $buildx = Invoke-ContabilidadeDocker -Arguments @('buildx', 'version') -AllowFailure
    if (-not $buildx.Success) {
        throw "Plugin Docker Buildx indisponivel. Instale ou habilite o Buildx no Docker Desktop. Exit code: $($buildx.ExitCode)."
    }
    Write-Host '[OK] Docker Buildx disponivel.' -ForegroundColor Green
}

function Get-ContabilidadeBuilderNames {
    $list = Invoke-ContabilidadeDocker -Arguments @('buildx', 'ls', '--format', '{{.Name}}') -AllowFailure -Quiet
    if (-not $list.Success) {
        Write-ContabilidadeNativeOutput -Result $list
        throw "Nao foi possivel consultar os builders Buildx. Exit code: $($list.ExitCode)."
    }

    return @($list.StdOut -split "`r?`n" | ForEach-Object { $_.Trim().TrimEnd('*') } | Where-Object { $_ })
}

function Assert-ContabilidadeBuilderDriver {
    param([string]$BuilderName, [Parameter(Mandatory = $true)]$Inspection)

    if ($Inspection.Output -notmatch '(?m)^Driver:\s+docker-container\s*$') {
        throw "O builder '$BuilderName' existe, mas nao usa o driver docker-container exigido pelo build local com default-load. Nenhuma configuracao global foi alterada."
    }
}

function Initialize-ContabilidadeBuilder {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)][string]$BuilderName)

    if ($BuilderName -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$') {
        throw "Nome de builder invalido: $BuilderName"
    }

    Write-Host "[INFO] Verificando builder $BuilderName..."
    $inspection = Invoke-ContabilidadeDocker -Arguments @('buildx', 'inspect', $BuilderName) -AllowFailure -Quiet
    $created = $false

    if (-not $inspection.Success) {
        # An inspect failure is not assumed to mean "not found". Listing builders
        # independently distinguishes first use from an existing inaccessible one.
        $knownBuilders = Get-ContabilidadeBuilderNames
        if ($knownBuilders -contains $BuilderName) {
            Write-ContabilidadeNativeOutput -Result $inspection
            throw "O builder '$BuilderName' existe, mas esta quebrado ou inacessivel (inspect exit $($inspection.ExitCode)). Ele nao sera removido automaticamente nesta etapa."
        }

        Write-Host '[INFO] Builder nao encontrado. Criando automaticamente...'
        $create = Invoke-ContabilidadeDocker -Arguments @(
            'buildx', 'create', '--name', $BuilderName,
            '--driver', 'docker-container',
            '--driver-opt', 'default-load=true,restart-policy=unless-stopped'
        ) -AllowFailure
        if (-not $create.Success) {
            throw "Falha ao criar o builder '$BuilderName'. Exit code: $($create.ExitCode)."
        }
        $created = $true
        Write-Host "[OK] Builder $BuilderName criado." -ForegroundColor Green
    }
    else {
        Assert-ContabilidadeBuilderDriver -BuilderName $BuilderName -Inspection $inspection
    }

    $use = Invoke-ContabilidadeDocker -Arguments @('buildx', 'use', $BuilderName) -AllowFailure
    if (-not $use.Success) {
        throw "Falha ao selecionar o builder '$BuilderName'. Exit code: $($use.ExitCode)."
    }

    Write-Host '[INFO] Inicializando builder...'
    $bootstrap = Invoke-ContabilidadeDocker -Arguments @('buildx', 'inspect', $BuilderName, '--bootstrap') -AllowFailure
    if (-not $bootstrap.Success) {
        throw "Falha no bootstrap do builder '$BuilderName'. Exit code: $($bootstrap.ExitCode)."
    }
    Assert-ContabilidadeBuilderDriver -BuilderName $BuilderName -Inspection $bootstrap

    if ($created) {
        Write-Host '[OK] Builder pronto.' -ForegroundColor Green
    }
    else {
        Write-Host '[OK] Builder existente e pronto.' -ForegroundColor Green
    }
}

Export-ModuleMember -Function @(
    'Invoke-ContabilidadeNativeCommand',
    'Invoke-ContabilidadeDocker',
    'Assert-ContabilidadeDockerAvailable',
    'Initialize-ContabilidadeBuilder'
)
