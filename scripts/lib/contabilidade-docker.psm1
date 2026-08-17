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

function Use-ContabilidadeDefaultBuilder {
    [CmdletBinding()]
    param()

    # PRIMA authority: ordinary local builds use Docker Desktop's default
    # daemon-backed builder. DNS/proxy authority therefore stays in Docker
    # Desktop/daemon configuration, never in a repository-local buildkitd file.
    $use = Invoke-ContabilidadeDocker -Arguments @('buildx', 'use', 'default') -AllowFailure -Quiet
    if (-not $use.Success) {
        Write-ContabilidadeNativeOutput -Result $use
        throw "Nao foi possivel selecionar o builder default do Docker Desktop. Exit code: $($use.ExitCode)."
    }

    $bootstrap = Invoke-ContabilidadeDocker -Arguments @('buildx', 'inspect', 'default', '--bootstrap') -AllowFailure -Quiet
    if (-not $bootstrap.Success) {
        Write-ContabilidadeNativeOutput -Result $bootstrap
        throw "O builder default do Docker Desktop nao ficou disponivel. Exit code: $($bootstrap.ExitCode)."
    }

    Write-Host '[OK] Builder default do Docker Desktop selecionado.' -ForegroundColor Green
}

function Remove-ContabilidadeLegacyIsolatedBuilder {
    [CmdletBinding()]
    param([string]$BuilderName = 'contabilidade-runtime-builder')

    $list = Invoke-ContabilidadeDocker -Arguments @('buildx', 'ls', '--format', '{{.Name}}') -AllowFailure -Quiet
    if (-not $list.Success) {
        return
    }

    $known = @(
        $list.StdOut -split "`r?`n" |
            ForEach-Object { $_.Trim().TrimEnd('*') } |
            Where-Object { $_ }
    )
    if ($known -notcontains $BuilderName) {
        return
    }

    Write-Warning "Removendo o builder legado '$BuilderName' criado pela solucao substituida."
    Write-Host 'Somente o builder/cache isolado sera removido; volumes, containers, imagens e dados da aplicacao permanecem.'
    $remove = Invoke-ContabilidadeDocker -Arguments @('buildx', 'rm', '--force', $BuilderName) -AllowFailure
    if (-not $remove.Success) {
        throw "Nao foi possivel remover o builder legado '$BuilderName'. Exit code: $($remove.ExitCode)."
    }
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
    'Use-ContabilidadeDefaultBuilder',
    'Remove-ContabilidadeLegacyIsolatedBuilder',
    'Test-ContabilidadeDockerDnsFailure',
    'Get-ContabilidadeFailedRegistryHost'
)
