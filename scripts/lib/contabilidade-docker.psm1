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

function ConvertTo-ContabilidadeIPv4DnsServers {
    [CmdletBinding()]
    param(
        [AllowNull()][object[]]$Values,
        [string[]]$RejectedServers = @()
    )

    $result = @()
    foreach ($rawValue in @($Values)) {
        if ($null -eq $rawValue) {
            continue
        }

        foreach ($candidate in ([string]$rawValue -split '[,;\s]+')) {
            $trimmed = $candidate.Trim()
            if ([string]::IsNullOrWhiteSpace($trimmed)) {
                continue
            }

            $parsed = $null
            if (-not [Net.IPAddress]::TryParse($trimmed, [ref]$parsed)) {
                continue
            }
            if ($parsed.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) {
                continue
            }

            $normalized = $parsed.IPAddressToString
            $bytes = $parsed.GetAddressBytes()
            $isUnusable = $bytes[0] -eq 0 `
                -or $bytes[0] -eq 127 `
                -or ($bytes[0] -eq 169 -and $bytes[1] -eq 254)

            if ($isUnusable -or $RejectedServers -contains $normalized -or $result -contains $normalized) {
                continue
            }

            $result += $normalized
        }
    }

    return @($result)
}

function Get-ContabilidadeBuildKitDnsServers {
    [CmdletBinding()]
    param([string[]]$RejectedServers = @())

    $configured = [Environment]::GetEnvironmentVariable('CONTABILIDADE_BUILDKIT_DNS', 'Process')
    if (-not [string]::IsNullOrWhiteSpace($configured)) {
        $explicit = ConvertTo-ContabilidadeIPv4DnsServers -Values @($configured) -RejectedServers $RejectedServers
        if ($explicit.Count -eq 0) {
            throw 'CONTABILIDADE_BUILDKIT_DNS foi informado, mas nao contem nenhum IPv4 valido e utilizavel.'
        }
        return $explicit
    }

    $candidates = @()
    try {
        foreach ($adapter in [Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()) {
            if ($adapter.OperationalStatus -ne [Net.NetworkInformation.OperationalStatus]::Up) {
                continue
            }
            if ($adapter.NetworkInterfaceType -eq [Net.NetworkInformation.NetworkInterfaceType]::Loopback) {
                continue
            }

            $properties = $adapter.GetIPProperties()
            $priority = 20
            if ($properties.GatewayAddresses.Count -gt 0) {
                $priority = 0
            }
            if ($adapter.Name -match '(?i)(docker|wsl|default switch)') {
                $priority += 100
            }

            foreach ($dnsAddress in $properties.DnsAddresses) {
                if ($dnsAddress.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork) {
                    continue
                }
                $candidates += [pscustomobject]@{
                    Address = $dnsAddress.IPAddressToString
                    Priority = $priority
                }
            }
        }
    }
    catch {
        Write-Verbose "Nao foi possivel enumerar DNS das interfaces: $($_.Exception.Message)"
    }

    $ordered = @($candidates | Sort-Object Priority, Address | ForEach-Object { $_.Address })
    return ConvertTo-ContabilidadeIPv4DnsServers -Values $ordered -RejectedServers $RejectedServers
}

function New-ContabilidadeBuildKitConfig {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string[]]$DnsServers
    )

    $validated = ConvertTo-ContabilidadeIPv4DnsServers -Values $DnsServers
    if ($validated.Count -eq 0) {
        throw 'Nao ha servidores DNS IPv4 validos para gerar a configuracao do BuildKit.'
    }

    $parent = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    $quotedServers = @($validated | ForEach-Object { '"' + $_ + '"' })
    $content = @(
        '# Gerado automaticamente pelo startup da Contabilidade.'
        '# Escopo: somente o builder isolado do projeto; Docker Desktop global nao e alterado.'
        '[dns]'
        "  nameservers = [$($quotedServers -join ', ')]"
        ''
    ) -join [Environment]::NewLine

    [IO.File]::WriteAllText(
        $Path,
        $content,
        (New-Object Text.UTF8Encoding($false))
    )

    return $Path
}

function Test-ContabilidadeBuildKitDnsFailure {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $false
    }

    return $Content -match '(?is)(dial\s+tcp[^\r\n]*lookup\s+[a-z0-9._-]+[^\r\n]*:53:\s*(no such host|server misbehaving|i/o timeout)|temporary failure in name resolution|could not resolve host)'
}

function Get-ContabilidadeFailedDnsServers {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return @()
    }

    $values = @()
    foreach ($match in [regex]::Matches($Content, '(?i)\bon\s+([0-9]{1,3}(?:\.[0-9]{1,3}){3}):53\b')) {
        $values += $match.Groups[1].Value
    }
    return ConvertTo-ContabilidadeIPv4DnsServers -Values $values
}

function Get-ContabilidadeFailedRegistryHost {
    [CmdletBinding()]
    param([AllowNull()][string]$Content)

    if ([string]::IsNullOrWhiteSpace($Content)) {
        return $null
    }

    $match = [regex]::Match($Content, '(?i)\blookup\s+([a-z0-9._-]+)\s+on\s+')
    if ($match.Success) {
        return $match.Groups[1].Value
    }
    return $null
}

function Initialize-ContabilidadeBuilder {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$BuilderName,
        [AllowNull()][string]$BuildKitConfigPath
    )

    if ($BuilderName -notmatch '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$') {
        throw "Nome de builder invalido: $BuilderName"
    }

    $resolvedConfig = $null
    if (-not [string]::IsNullOrWhiteSpace($BuildKitConfigPath)) {
        if (-not (Test-Path -LiteralPath $BuildKitConfigPath -PathType Leaf)) {
            throw "Configuracao BuildKit ausente: $BuildKitConfigPath"
        }
        $resolvedConfig = (Resolve-Path -LiteralPath $BuildKitConfigPath).Path
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
        $createArguments = @(
            'buildx', 'create', '--name', $BuilderName,
            '--driver', 'docker-container',
            '--driver-opt', 'default-load=true,restart-policy=unless-stopped'
        )
        if ($null -ne $resolvedConfig) {
            $createArguments += @('--buildkitd-config', $resolvedConfig)
            Write-Host "[INFO] Configuracao DNS project-scoped: $resolvedConfig"
        }

        $create = Invoke-ContabilidadeDocker -Arguments $createArguments -AllowFailure
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
    'Initialize-ContabilidadeBuilder',
    'Get-ContabilidadeBuildKitDnsServers',
    'New-ContabilidadeBuildKitConfig',
    'Test-ContabilidadeBuildKitDnsFailure',
    'Get-ContabilidadeFailedDnsServers',
    'Get-ContabilidadeFailedRegistryHost'
)
