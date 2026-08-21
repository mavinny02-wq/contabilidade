Set-StrictMode -Version Latest

$dockerModulePath = Join-Path $PSScriptRoot 'contabilidade-docker.psm1'
# Reloading this dependency from inside the probe module removes an already imported
# contabilidade-docker command surface from the caller under Windows PowerShell 5.1.
# A normal import still makes the dependency available to this module without invalidating it
# for startup scripts that intentionally use both modules.
Import-Module $dockerModulePath

$script:DefaultProbeName = 'contabilidade-startup-probe'
$script:DefaultProbeLabelKey = 'contabilidade.local.startup-probe'
$script:DefaultProbeLabelValue = 'true'

function New-ContabilidadeStartupProbeResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Category,
        [Parameter(Mandatory = $true)][bool]$Success,
        [int]$ExitCode = 0,
        [AllowNull()][string]$ContainerId,
        [AllowNull()][string]$Status,
        [AllowNull()][string]$StdOut,
        [AllowNull()][string]$StdErr
    )

    return [pscustomobject]@{
        Name = $Name
        Category = $Category
        Success = $Success
        ExitCode = $ExitCode
        ContainerId = $ContainerId
        Status = $Status
        StdOut = if ($null -eq $StdOut) { '' } else { $StdOut }
        StdErr = if ($null -eq $StdErr) { '' } else { $StdErr }
    }
}

function Get-ContabilidadeStartupProbeState {
    [CmdletBinding()]
    param(
        [string]$Name = $script:DefaultProbeName,
        [string]$LabelKey = $script:DefaultProbeLabelKey,
        [string]$LabelValue = $script:DefaultProbeLabelValue
    )

    $format = '{{.Id}}|{{.State.Status}}|{{index .Config.Labels "' + $LabelKey + '"}}'
    $inspect = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'inspect', '--format', $format, $Name) `
        -AllowFailure `
        -Quiet

    if (-not $inspect.Success) {
        if (Test-ContabilidadeDockerContainerAbsent -Content $inspect.Output) {
            return [pscustomobject]@{
                Name = $Name
                Exists = $false
                Owned = $false
                ContainerId = $null
                Status = 'missing'
                LabelValue = $null
                Category = 'CONTAINER_ABSENT_EXPECTED'
                ExitCode = $inspect.ExitCode
            }
        }

        $category = Get-ContabilidadeDockerFailureCategory -Content $inspect.Output
        throw "[$category] Nao foi possivel inspecionar o probe '$Name'. Exit code: $($inspect.ExitCode)."
    }

    $line = @(
        $inspect.StdOut -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    ) | Select-Object -First 1

    if ([string]::IsNullOrWhiteSpace($line)) {
        throw "[DOCKER_PERMISSION_OR_API_FAILURE] Docker nao retornou estado para o probe '$Name'."
    }

    $parts = @($line -split '\|', 3)
    if ($parts.Count -lt 2 -or [string]::IsNullOrWhiteSpace($parts[0])) {
        throw "[DOCKER_PERMISSION_OR_API_FAILURE] Estado invalido retornado para o probe '$Name'."
    }

    $actualLabelValue = if ($parts.Count -ge 3) { $parts[2].Trim() } else { '' }
    return [pscustomobject]@{
        Name = $Name
        Exists = $true
        Owned = ($actualLabelValue -eq $LabelValue)
        ContainerId = $parts[0].Trim()
        Status = $parts[1].Trim()
        LabelValue = $actualLabelValue
        Category = 'CONTAINER_PRESENT'
        ExitCode = $inspect.ExitCode
    }
}

function Remove-ContabilidadeStartupProbe {
    [CmdletBinding()]
    param(
        [string]$Name = $script:DefaultProbeName,
        [string]$LabelKey = $script:DefaultProbeLabelKey,
        [string]$LabelValue = $script:DefaultProbeLabelValue
    )

    $state = Get-ContabilidadeStartupProbeState -Name $Name -LabelKey $LabelKey -LabelValue $LabelValue
    if (-not $state.Exists) {
        return New-ContabilidadeStartupProbeResult `
            -Name $Name `
            -Category 'CONTAINER_ABSENT_EXPECTED' `
            -Success $true `
            -ExitCode $state.ExitCode `
            -Status 'missing'
    }

    if (-not $state.Owned) {
        throw "[PROBE_NAME_OWNERSHIP_CONFLICT] O container '$Name' existe, mas nao possui o label esperado '$LabelKey=$LabelValue'. Nenhum container foi removido."
    }

    # Remove by immutable container ID, not by name. A concurrent actor cannot replace the
    # name with an unrelated container and make this cleanup delete the replacement.
    $remove = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'rm', '--force', $state.ContainerId) `
        -AllowFailure `
        -Quiet

    if (-not $remove.Success) {
        if (Test-ContabilidadeDockerContainerAbsent -Content $remove.Output) {
            return New-ContabilidadeStartupProbeResult `
                -Name $Name `
                -Category 'CONCURRENT_REMOVAL_EXPECTED' `
                -Success $true `
                -ExitCode $remove.ExitCode `
                -ContainerId $state.ContainerId `
                -Status 'missing' `
                -StdOut $remove.StdOut `
                -StdErr $remove.StdErr
        }

        $failureCategory = Get-ContabilidadeDockerFailureCategory -Content $remove.Output
        throw "[PROBE_REMOVE_FAILED][$failureCategory] Falha real ao remover o probe '$Name'. Exit code: $($remove.ExitCode)."
    }

    $after = Get-ContabilidadeStartupProbeState -Name $Name -LabelKey $LabelKey -LabelValue $LabelValue
    if ($after.Exists) {
        if (-not $after.Owned) {
            throw "[PROBE_NAME_OWNERSHIP_CONFLICT] O probe original foi removido, mas o nome '$Name' foi reutilizado por outro container."
        }
        throw "[PROBE_REMOVE_FAILED] O probe '$Name' ainda existe depois de docker container rm --force."
    }

    $category = if ($state.Status -eq 'running') {
        'CONTAINER_RUNNING_REMOVED'
    }
    else {
        'CONTAINER_REMOVED'
    }

    return New-ContabilidadeStartupProbeResult `
        -Name $Name `
        -Category $category `
        -Success $true `
        -ExitCode $remove.ExitCode `
        -ContainerId $state.ContainerId `
        -Status 'missing' `
        -StdOut $remove.StdOut `
        -StdErr $remove.StdErr
}

function Start-ContabilidadeStartupProbe {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string[]]$ComposePrefix,
        [string]$Service = 'frontend',
        [string]$Name = $script:DefaultProbeName,
        [string]$LabelKey = $script:DefaultProbeLabelKey,
        [string]$LabelValue = $script:DefaultProbeLabelValue,
        [string]$Command = 'while :; do sleep 3600; done'
    )

    $null = Remove-ContabilidadeStartupProbe -Name $Name -LabelKey $LabelKey -LabelValue $LabelValue
    $label = "$LabelKey=$LabelValue"
    $arguments = @(
        $ComposePrefix + @(
            'run', '--no-deps', '-d',
            '--name', $Name,
            '--label', $label,
            '--entrypoint', '/bin/sh',
            $Service,
            '-c', $Command
        )
    )

    $create = Invoke-ContabilidadeDocker -Arguments $arguments -AllowFailure -Quiet
    if (-not $create.Success) {
        $category = Get-ContabilidadeDockerFailureCategory -Content $create.Output
        throw "[PROBE_CREATE_FAILED][$category] Nao foi possivel criar o probe '$Name'. Exit code: $($create.ExitCode)."
    }

    $state = Get-ContabilidadeStartupProbeState -Name $Name -LabelKey $LabelKey -LabelValue $LabelValue
    if (-not $state.Exists) {
        throw "[PROBE_CREATE_FAILED] Docker Compose retornou sucesso, mas o probe '$Name' nao existe."
    }
    if (-not $state.Owned) {
        throw "[PROBE_NAME_OWNERSHIP_CONFLICT] O probe '$Name' foi criado sem o label esperado '$LabelKey=$LabelValue'."
    }
    if ($state.Status -ne 'running') {
        throw "[PROBE_CREATE_FAILED] O probe '$Name' nao permaneceu em execucao. Status=$($state.Status)."
    }

    return New-ContabilidadeStartupProbeResult `
        -Name $Name `
        -Category 'PROBE_RUNNING' `
        -Success $true `
        -ExitCode $create.ExitCode `
        -ContainerId $state.ContainerId `
        -Status $state.Status `
        -StdOut $create.StdOut `
        -StdErr $create.StdErr
}

function Invoke-ContabilidadeStartupProbeRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSeconds = 5,
        [string]$Name = $script:DefaultProbeName,
        [string]$LabelKey = $script:DefaultProbeLabelKey,
        [string]$LabelValue = $script:DefaultProbeLabelValue
    )

    $state = Get-ContabilidadeStartupProbeState -Name $Name -LabelKey $LabelKey -LabelValue $LabelValue
    if (-not $state.Exists) {
        return New-ContabilidadeStartupProbeResult `
            -Name $Name `
            -Category 'PROBE_ABSENT' `
            -Success $false `
            -ExitCode $state.ExitCode `
            -Status 'missing'
    }
    if (-not $state.Owned) {
        throw "[PROBE_NAME_OWNERSHIP_CONFLICT] O container '$Name' nao pertence ao startup do Contabilidade."
    }
    if ($state.Status -ne 'running') {
        return New-ContabilidadeStartupProbeResult `
            -Name $Name `
            -Category 'PROBE_NOT_RUNNING' `
            -Success $false `
            -ExitCode 1 `
            -ContainerId $state.ContainerId `
            -Status $state.Status
    }

    $request = Invoke-ContabilidadeDocker `
        -Arguments @(
            'exec', $state.ContainerId,
            'wget', '-q', '-T', [string]$TimeoutSeconds, '-O', '-', $Url
        ) `
        -AllowFailure `
        -Quiet

    return New-ContabilidadeStartupProbeResult `
        -Name $Name `
        -Category $(if ($request.Success) { 'PROBE_REQUEST_SUCCEEDED' } else { 'PROBE_REQUEST_PENDING' }) `
        -Success $request.Success `
        -ExitCode $request.ExitCode `
        -ContainerId $state.ContainerId `
        -Status $state.Status `
        -StdOut $request.StdOut `
        -StdErr $request.StdErr
}

function Invoke-ContabilidadeWithProbeCleanup {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Operation,
        [Parameter(Mandatory = $true)][scriptblock]$Cleanup
    )

    $operationResult = $null
    $cleanupResult = $null
    $operationError = $null
    $cleanupError = $null

    try {
        $operationResult = & $Operation
    }
    catch {
        $operationError = $_
    }

    try {
        $cleanupResult = & $Cleanup
    }
    catch {
        $cleanupError = $_
    }

    if ($null -ne $operationError) {
        if ($null -ne $cleanupError) {
            $message = '[STARTUP_OPERATION_FAILED] ' + $operationError.Exception.Message +
                ' | [STARTUP_CLEANUP_FAILED] ' + $cleanupError.Exception.Message
            $exception = New-Object System.Exception($message, $operationError.Exception)
            $exception.Data['CleanupFailure'] = $cleanupError.Exception.Message
            throw $exception
        }
        throw $operationError
    }

    if ($null -ne $cleanupError) {
        throw $cleanupError
    }

    return [pscustomobject]@{
        Result = $operationResult
        Cleanup = $cleanupResult
    }
}

Export-ModuleMember -Function @(
    'New-ContabilidadeStartupProbeResult',
    'Get-ContabilidadeStartupProbeState',
    'Remove-ContabilidadeStartupProbe',
    'Start-ContabilidadeStartupProbe',
    'Invoke-ContabilidadeStartupProbeRequest',
    'Invoke-ContabilidadeWithProbeCleanup'
)
