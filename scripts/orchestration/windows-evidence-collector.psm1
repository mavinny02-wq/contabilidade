Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ExitCodeInvalidArguments = 2
$script:ExitCodeWriteFailure = 3
$script:ExitCodeCollectionFailure = 4

function ConvertTo-RedactedText {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) { return $null }

    $redacted = $Text
    $redacted = $redacted -replace '(?i)(https?://)[^\s/@:]+:[^\s/@]+@', '$1[REDACTED]@'
    $redacted = $redacted -replace '(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+', '$1[REDACTED]'
    $redacted = $redacted -replace '(?i)((?:password|passwd|pwd|token|secret|client_secret|apikey|api_key)\s*[=:]\s*)[^\s;]+', '$1[REDACTED]'
    $redacted = $redacted -replace '(?s)-----BEGIN [^-]*(?:PRIVATE KEY|CERTIFICATE)-----.*?-----END [^-]*(?:PRIVATE KEY|CERTIFICATE)-----', '[REDACTED]'
    return $redacted.Trim()
}

function Invoke-EvidenceCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [string[]]$Arguments = @()
    )

    try {
        $executable = Get-Command $Command -ErrorAction SilentlyContinue
        if ($null -eq $executable) {
            return [ordered]@{ status = 'indisponivel'; exitCode = $null; output = $null }
        }

        $output = & $executable.Source @Arguments 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }

        return [ordered]@{
            status = $(if ($exitCode -eq 0) { 'disponivel' } else { 'erro' })
            exitCode = [int]$exitCode
            output = ConvertTo-RedactedText $output
        }
    }
    catch {
        return [ordered]@{
            status = 'erro'
            exitCode = $null
            output = ConvertTo-RedactedText $_.Exception.Message
        }
    }
}

function New-WindowsEvidence {
    $gitVersion = Invoke-EvidenceCommand -Command 'git' -Arguments @('--version')
    $gitRevision = Invoke-EvidenceCommand -Command 'git' -Arguments @('rev-parse', '--verify', 'HEAD')
    $gitStatus = Invoke-EvidenceCommand -Command 'git' -Arguments @('status', '--short', '--branch')
    $dockerVersion = Invoke-EvidenceCommand -Command 'docker' -Arguments @('version', '--format', '{{json .}}')
    $composeVersion = Invoke-EvidenceCommand -Command 'docker' -Arguments @('compose', 'version', '--short')
    $wslStatus = Invoke-EvidenceCommand -Command 'wsl.exe' -Arguments @('--status')

    return [ordered]@{
        schemaVersion = '1.0.0'
        collectedAtUtc = [DateTime]::UtcNow.ToString('o')
        collectorVersion = '1.0.0'
        platform = [ordered]@{
            os = [System.Environment]::OSVersion.VersionString
            architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()
            machineNameHash = Get-StableHash ([System.Environment]::MachineName)
        }
        powershell = [ordered]@{
            edition = $PSVersionTable.PSEdition
            version = $PSVersionTable.PSVersion.ToString()
        }
        git = [ordered]@{
            version = $gitVersion
            revision = $gitRevision
            status = $gitStatus
        }
        docker = [ordered]@{
            version = $dockerVersion
            compose = $composeVersion
        }
        wsl = $wslStatus
        environment = [ordered]@{
            CI = [bool]([System.Environment]::GetEnvironmentVariable('CI'))
            WSL_DISTRO_NAME = [bool]([System.Environment]::GetEnvironmentVariable('WSL_DISTRO_NAME'))
            DOCKER_HOST = [bool]([System.Environment]::GetEnvironmentVariable('DOCKER_HOST'))
        }
    }
}

function Get-StableHash {
    param([Parameter(Mandatory = $true)][string]$Value)

    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Value)
        return ([BitConverter]::ToString($sha256.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $sha256.Dispose()
    }
}

function Write-WindowsEvidence {
    param([AllowEmptyString()][string]$Destination = '')

    if ([string]::IsNullOrWhiteSpace($Destination)) { return $script:ExitCodeInvalidArguments }

    try {
        $evidence = New-WindowsEvidence
    }
    catch {
        [Console]::Error.WriteLine("Falha ao coletar evidencias: {0}" -f (ConvertTo-RedactedText $_.Exception.Message))
        return $script:ExitCodeCollectionFailure
    }

    try {
        $absolutePath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
        $directory = Split-Path -Parent $absolutePath
        if (-not [string]::IsNullOrEmpty($directory)) {
            [System.IO.Directory]::CreateDirectory($directory) | Out-Null
        }
        $json = $evidence | ConvertTo-Json -Depth 8
        [System.IO.File]::WriteAllText($absolutePath, $json, (New-Object System.Text.UTF8Encoding($false)))
        Write-Output $absolutePath
        return 0
    }
    catch {
        [Console]::Error.WriteLine("Falha ao gravar evidencias: {0}" -f (ConvertTo-RedactedText $_.Exception.Message))
        return $script:ExitCodeWriteFailure
    }
}

Export-ModuleMember -Function ConvertTo-RedactedText, New-WindowsEvidence, Write-WindowsEvidence
