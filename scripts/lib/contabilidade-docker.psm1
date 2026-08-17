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
        # Windows PowerShell 5.1 can turn native stderr into NativeCommandError
        # when the caller uses Stop. Native exit code remains the sole authority.
        $ErrorActionPreference = 'Continue'
        & $FilePath @Arguments 1> $stdoutPath 2> $stderrPath
        $exitCode = $LASTEXITCODE

        $stdout = [IO.File]::ReadAllText($stdoutPath)
        $stderr = [IO.File]::ReadAllText($stderrPath)

        return [pscustomobject]@{
            ExitCode = $exitCode
            StdOut = $stdout
            StdErr = $stderr
            Output = ($stdout + $stderr)
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
    $info = Invoke-ContabilidadeDocker -Arguments @('info') -AllowFailure -Quiet
    if (-not $info.Success) {
        throw "Docker CLI encontrado, mas o daemon nao esta acessivel. Inicie o Docker Desktop e tente novamente. Exit code: $($info.ExitCode)."
    }
    Write-Host '[OK] Docker daemon disponivel.' -ForegroundColor Green

    $compose = Invoke-ContabilidadeDocker -Arguments @('compose', 'version') -AllowFailure -Quiet
    if (-not $compose.Success) {
        throw "Docker Compose v2 indisponivel. Repare o Docker Desktop. Exit code: $($compose.ExitCode)."
    }

    $buildx = Invoke-ContabilidadeDocker -Arguments @('buildx', 'version') -AllowFailure -Quiet
    if (-not $buildx.Success) {
        throw "Plugin Docker Buildx indisponivel. Repare o Docker Desktop. Exit code: $($buildx.ExitCode)."
    }
}

function Get-ContabilidadeActiveDockerContext {
    [CmdletBinding()]
    param()

    # PRIMA authority: preserve the Docker context already selected by the user.
    # Never call `docker context use` or `docker buildx use` from project startup.
    $context = Invoke-ContabilidadeDocker -Arguments @('context', 'show') -AllowFailure -Quiet
    if (-not $context.Success) {
        Write-ContabilidadeNativeOutput -Result $context
        throw "Nao foi possivel consultar o contexto Docker ativo. Exit code: $($context.ExitCode)."
    }

    $names = @(
        $context.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    if ($names.Count -eq 0) {
        throw 'Docker nao informou um contexto ativo.'
    }

    return [string]$names[0]
}

function Test-ContabilidadeDockerDnsFailure {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(dial\s+tcp[^\r\n]*lookup\s+[a-z0-9._-]+[^\r\n]*:53:\s*(no such host|server misbehaving|i/o timeout)|temporary failure in name resolution|could not resolve host|unknown host)'
}

function Get-ContabilidadeFailedRegistryHost {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $null
    }

    $patterns = @(
        '(?i)\blookup\s+([a-z0-9._-]+)\s+on\s+',
        '(?i)\bunknown host\s+([a-z0-9._-]+)',
        '(?i)\bcould not resolve host:\s*([a-z0-9._-]+)'
    )
    foreach ($pattern in $patterns) {
        $match = [regex]::Match($Content, $pattern)
        if ($match.Success) {
            return $match.Groups[1].Value
        }
    }
    return $null
}

Export-ModuleMember -Function @(
    'Invoke-ContabilidadeNativeCommand',
    'Invoke-ContabilidadeDocker',
    'Assert-ContabilidadeDockerAvailable',
    'Get-ContabilidadeActiveDockerContext',
    'Test-ContabilidadeDockerDnsFailure',
    'Get-ContabilidadeFailedRegistryHost'
)
