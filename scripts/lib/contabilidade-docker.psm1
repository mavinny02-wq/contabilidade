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
        # Windows PowerShell 5.1 can promote native stderr to NativeCommandError when
        # the caller uses Stop. The native exit code remains the only success authority.
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
    [CmdletBinding()]
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

    $dockerCommand = Get-Command docker -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -eq $dockerCommand) {
        $missing = [pscustomobject]@{
            ExitCode = 127
            StdOut = ''
            StdErr = 'Docker CLI unavailable.'
            Output = 'Docker CLI unavailable.'
            Success = $false
        }
        if (-not $Quiet) {
            Write-ContabilidadeNativeOutput -Result $missing
        }
        if (-not $AllowFailure) {
            throw '[DOCKER_CLI_UNAVAILABLE] Docker CLI nao encontrado no PATH.'
        }
        return $missing
    }

    $dockerPath = if (-not [string]::IsNullOrWhiteSpace($dockerCommand.Source)) {
        $dockerCommand.Source
    }
    else {
        $dockerCommand.Path
    }
    $result = Invoke-ContabilidadeNativeCommand -FilePath $dockerPath -Arguments $Arguments
    if (-not $Quiet) {
        Write-ContabilidadeNativeOutput -Result $result
    }
    if (-not $AllowFailure -and -not $result.Success) {
        throw "Docker falhou: docker $($Arguments -join ' '). Exit code: $($result.ExitCode)."
    }
    return $result
}

function Invoke-ContabilidadeCompose {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string[]]$ComposePrefix,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Quiet
    )

    $fullArguments = @($ComposePrefix + $Arguments)
    return Invoke-ContabilidadeDocker `
        -Arguments $fullArguments `
        -AllowFailure:$AllowFailure `
        -Quiet:$Quiet
}

function Test-ContabilidadeDockerContainerAbsent {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(no such container|no such object(?:\s*:\s*|\s+)[^\r\n]+)'
}

function Test-ContabilidadeDockerImageMissing {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(no such image|unable to find image[^\r\n]*locally|pull access denied[^\r\n]*repository does not exist)'
}

function Test-ContabilidadeDockerDaemonUnavailable {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(cannot connect to the docker daemon|is the docker daemon running|error during connect|dockerdesktoplinuxengine|open \\.\\pipe\\docker|the system cannot find the file specified[^\r\n]*docker|context deadline exceeded)'
}

function Get-ContabilidadeDockerFailureCategory {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if (Test-ContabilidadeDockerContainerAbsent -Content $Content) {
        return 'CONTAINER_ABSENT_EXPECTED'
    }
    if (Test-ContabilidadeDockerImageMissing -Content $Content) {
        return 'IMAGE_MISSING'
    }
    if (Test-ContabilidadeDockerDaemonUnavailable -Content $Content) {
        return 'DOCKER_DAEMON_UNAVAILABLE'
    }
    return 'DOCKER_PERMISSION_OR_API_FAILURE'
}

function Test-ContabilidadeDockerImage {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)][string]$Image)

    if (-not (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue)) {
        return [pscustomobject]@{
            Image = $Image
            Available = $false
            Category = 'DOCKER_CLI_UNAVAILABLE'
            ExitCode = 127
            StdOut = ''
            StdErr = 'Docker CLI unavailable.'
        }
    }

    $result = Invoke-ContabilidadeDocker -Arguments @('image', 'inspect', $Image) -AllowFailure -Quiet
    if ($result.Success) {
        return [pscustomobject]@{
            Image = $Image
            Available = $true
            Category = 'IMAGE_AVAILABLE'
            ExitCode = $result.ExitCode
            StdOut = $result.StdOut
            StdErr = $result.StdErr
        }
    }

    return [pscustomobject]@{
        Image = $Image
        Available = $false
        Category = Get-ContabilidadeDockerFailureCategory -Content $result.Output
        ExitCode = $result.ExitCode
        StdOut = $result.StdOut
        StdErr = $result.StdErr
    }
}

function Test-ContabilidadeRuntimeImage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$Image,
        [Parameter(Mandatory = $true)][string]$DisplayName,
        [Parameter(Mandatory = $true)][string]$ValidationCommand
    )

    $imageState = Test-ContabilidadeDockerImage -Image $Image
    if (-not $imageState.Available) {
        return [pscustomobject]@{
            Image = $Image
            DisplayName = $DisplayName
            Verified = $false
            Category = $imageState.Category
            ExitCode = $imageState.ExitCode
            StdOut = $imageState.StdOut
            StdErr = $imageState.StdErr
        }
    }

    $result = Invoke-ContabilidadeDocker `
        -Arguments @(
            'run', '--rm', '--entrypoint', '/bin/sh',
            $Image, '-c', $ValidationCommand
        ) `
        -AllowFailure `
        -Quiet

    if ($result.Success) {
        return [pscustomobject]@{
            Image = $Image
            DisplayName = $DisplayName
            Verified = $true
            Category = 'RUNTIME_IMAGE_VERIFIED'
            ExitCode = $result.ExitCode
            StdOut = $result.StdOut
            StdErr = $result.StdErr
        }
    }

    $category = Get-ContabilidadeDockerFailureCategory -Content $result.Output
    if ($category -eq 'CONTAINER_ABSENT_EXPECTED') {
        $category = 'RUNTIME_IMAGE_VALIDATION_FAILED'
    }
    return [pscustomobject]@{
        Image = $Image
        DisplayName = $DisplayName
        Verified = $false
        Category = $category
        ExitCode = $result.ExitCode
        StdOut = $result.StdOut
        StdErr = $result.StdErr
    }
}

function Assert-ContabilidadeDockerAvailable {
    [CmdletBinding()]
    param()

    if (-not (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue)) {
        throw '[DOCKER_CLI_UNAVAILABLE] Docker CLI nao encontrado. Instale ou repare o Docker Desktop e confirme que docker.exe esta no PATH.'
    }

    Write-Host '[INFO] Verificando Docker daemon...'
    $info = Invoke-ContabilidadeDocker -Arguments @('info') -AllowFailure -Quiet
    if (-not $info.Success) {
        $category = Get-ContabilidadeDockerFailureCategory -Content $info.Output
        if ($category -eq 'DOCKER_PERMISSION_OR_API_FAILURE' -and
            (Test-ContabilidadeDockerDaemonUnavailable -Content $info.Output)) {
            $category = 'DOCKER_DAEMON_UNAVAILABLE'
        }
        throw "[$category] Docker CLI encontrado, mas o daemon nao esta acessivel. Inicie o Docker Desktop e tente novamente. Exit code: $($info.ExitCode)."
    }
    Write-Host '[OK] Docker daemon disponivel.' -ForegroundColor Green

    $compose = Invoke-ContabilidadeDocker -Arguments @('compose', 'version') -AllowFailure -Quiet
    if (-not $compose.Success) {
        throw "[DOCKER_PERMISSION_OR_API_FAILURE] Docker Compose v2 indisponivel. Repare o Docker Desktop. Exit code: $($compose.ExitCode)."
    }

    $buildx = Invoke-ContabilidadeDocker -Arguments @('buildx', 'version') -AllowFailure -Quiet
    if (-not $buildx.Success) {
        throw "[DOCKER_PERMISSION_OR_API_FAILURE] Plugin Docker Buildx indisponivel. Repare o Docker Desktop. Exit code: $($buildx.ExitCode)."
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
    'Write-ContabilidadeNativeOutput',
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
