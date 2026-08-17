param(
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$DockerModule = Join-Path $ProjectDir 'scripts\lib\contabilidade-docker.psm1'
Import-Module $DockerModule -Force

$parent = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrWhiteSpace($parent)) {
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
}

$lines = New-Object 'System.Collections.Generic.List[string]'

function Add-Line {
    param([AllowNull()][string]$Value = '')
    $lines.Add($(if ($null -eq $Value) { '' } else { $Value }))
}

function Add-NativeResult {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)]$Result
    )
    Add-Line ''
    Add-Line "[$Label]"
    Add-Line "exit_code=$($Result.ExitCode)"
    if (-not [string]::IsNullOrWhiteSpace($Result.StdOut)) {
        foreach ($line in ($Result.StdOut.TrimEnd() -split "`r?`n")) {
            Add-Line $line
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($Result.StdErr)) {
        foreach ($line in ($Result.StdErr.TrimEnd() -split "`r?`n")) {
            Add-Line $line
        }
    }
}

function Add-HostProbe {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string]$HostName,
        [Parameter(Mandatory = $true)][string]$Url
    )

    Add-Line ''
    Add-Line "[$Label]"
    try {
        $addresses = @([Net.Dns]::GetHostAddresses($HostName) |
            Where-Object { $_.AddressFamily -eq [Net.Sockets.AddressFamily]::InterNetwork } |
            Select-Object -First 8)
        if ($addresses.Count -eq 0) {
            Add-Line 'resolver=NO_IPV4_RESULT'
        }
        else {
            Add-Line ('resolver=' + (($addresses | ForEach-Object { $_.IPAddressToString }) -join ','))
        }
    }
    catch {
        Add-Line ('resolver_error=' + $_.Exception.GetType().Name)
    }

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Method Head -Uri $Url -TimeoutSec 15
        Add-Line "http_status=$([int]$response.StatusCode)"
    }
    catch {
        $status = $null
        if ($null -ne $_.Exception.Response) {
            try {
                $status = [int]$_.Exception.Response.StatusCode
            }
            catch {
                $status = $null
            }
        }
        if ($null -ne $status) {
            Add-Line "http_status=$status"
        }
        else {
            Add-Line ('http_error=' + $_.Exception.GetType().Name)
        }
    }
}

# Same diagnostic boundary used by PRIMA: resolver reachability and
# daemon/build metadata only. Never dump environment variables, Docker config,
# proxy values or credentials.
Add-Line '[host resolver]'
Add-HostProbe -Label 'Docker registry from host' `
    -HostName 'registry-1.docker.io' `
    -Url 'https://registry-1.docker.io/v2/'
Add-HostProbe -Label 'Microsoft registry from host' `
    -HostName 'mcr.microsoft.com' `
    -Url 'https://mcr.microsoft.com/v2/'

$daemonVersion = Invoke-ContabilidadeDocker -Arguments @(
    'version', '--format', 'client={{.Client.Version}} server={{.Server.Version}}'
) -AllowFailure -Quiet
Add-NativeResult -Label 'Docker daemon version' -Result $daemonVersion

$daemonInfo = Invoke-ContabilidadeDocker -Arguments @(
    'info', '--format', 'driver={{.Driver}} cgroup={{.CgroupDriver}} os={{.OperatingSystem}}'
) -AllowFailure -Quiet
Add-NativeResult -Label 'Docker daemon metadata' -Result $daemonInfo

$containerResolver = Invoke-ContabilidadeDocker -Arguments @(
    'run', '--rm', 'alpine:3.20', 'sh', '-c',
    "sed -n '/^nameserver /p;/^options /p' /etc/resolv.conf; nslookup registry-1.docker.io; nslookup mcr.microsoft.com"
) -AllowFailure -Quiet
Add-NativeResult -Label 'Docker container resolver' -Result $containerResolver

$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('contabilidade-docker-network-' + [Guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
    $dockerfile = Join-Path $tempRoot 'Dockerfile'
    $content = @(
        'FROM alpine:3.20'
        "RUN sed -n '/^nameserver /p;/^options /p' /etc/resolv.conf && nslookup registry-1.docker.io && nslookup mcr.microsoft.com && wget -q --spider https://registry-1.docker.io/v2/"
        ''
    ) -join [Environment]::NewLine
    [IO.File]::WriteAllText($dockerfile, $content, (New-Object Text.UTF8Encoding($false)))

    $buildResolver = Invoke-ContabilidadeDocker -Arguments @(
        'build', '--no-cache', '--progress=plain', '--file', $dockerfile, $tempRoot
    ) -AllowFailure -Quiet
    Add-NativeResult -Label 'BuildKit resolver' -Result $buildResolver
}
finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}

[IO.File]::WriteAllLines(
    $OutputPath,
    $lines,
    (New-Object Text.UTF8Encoding($false))
)
Write-Host "Diagnostico Docker gravado em: $OutputPath"
exit 0
