Set-StrictMode -Version Latest

$dockerModulePath = Join-Path $PSScriptRoot 'contabilidade-docker.psm1'
# Do not force-reload a dependency from inside another module. In Windows PowerShell 5.1,
# a nested Import-Module -Force can remove commands that the caller imported from the same
# module.
Import-Module $dockerModulePath -ErrorAction Stop

foreach ($requiredCommand in @(
    'Invoke-ContabilidadeDocker',
    'Test-ContabilidadeDockerContainerAbsent',
    'Get-ContabilidadeDockerFailureCategory'
)) {
    if ($null -eq (Get-Command -Name $requiredCommand -ErrorAction SilentlyContinue | Select-Object -First 1)) {
        throw "[STARTUP_MODULE_CONTRACT] Dependencia Docker ausente no modulo startup-probe: $requiredCommand"
    }
}

$script:DefaultProbeName = 'contabilidade-startup-probe'
$script:DefaultProbeLabelKey = 'contabilidade.local.startup-probe'
$script:DefaultProbeLabelValue = 'true'

function Get-ContabilidadeProbeFailureDetail {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)]$Result)

    $detail = (([string]$Result.StdErr) + [Environment]::NewLine + ([string]$Result.StdOut)).Trim()
    if ([string]::IsNullOrWhiteSpace($detail)) {
        return 'sem detalhe do Docker'
    }

    $detail = [regex]::Replace($detail, '(?i)\b(password|passwd|token|secret|client_secret)\s*[:=]\s*[^\s;]+', '$1=[REDACTED]')
    $detail = [regex]::Replace($detail, '(?i)(https?://)[^\s/@:]+:[^\s/@]+@', '$1[REDACTED]@')
    $detail = [regex]::Replace($detail, '[\r\n]+', ' ').Trim()
    if ($detail.Length -gt 600) {
        return $detail.Substring(0, 600) + '...'
    }
    return $detail
}

function ConvertFrom-ContabilidadeProbeInspectOutput {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$RawOutput,
        [Parameter(Mandatory = $true)][string]$LabelKey
    )

    $raw = $RawOutput.Trim()
    if ([string]::IsNullOrWhiteSpace($raw)) {
        throw '[DOCKER_INSPECT_INVALID_OUTPUT] Docker retornou inspect vazio para o probe.'
    }

    # Runtime authority: parse the regular JSON returned by `docker container inspect`.
    # This avoids Go-template strings with embedded quotes, which are not transported
    # reliably by the legacy native argument binder in Windows PowerShell 5.1.
    if ($raw.StartsWith('[') -or $raw.StartsWith('{')) {
        try {
            $containers = @($raw | ConvertFrom-Json -ErrorAction Stop)
        }
        catch {
            throw "[DOCKER_INSPECT_INVALID_JSON] Docker retornou JSON invalido para o probe: $($_.Exception.Message)"
        }

        if ($containers.Count -lt 1 -or $null -eq $containers[0]) {
            throw '[DOCKER_INSPECT_INVALID_JSON] Docker nao retornou um objeto de container para o probe.'
        }

        $container = $containers[0]
        $containerId = [string]$container.Id
        $status = [string]$container.State.Status
        if ([string]::IsNullOrWhiteSpace($containerId) -or [string]::IsNullOrWhiteSpace($status)) {
            throw '[DOCKER_INSPECT_INVALID_JSON] Docker omitiu Id ou State.Status no inspect do probe.'
        }

        $actualLabelValue = ''
        if ($null -ne $container.Config -and $null -ne $container.Config.Labels) {
            $labelProperty = $container.Config.Labels.PSObject.Properties[$LabelKey]
            if ($null -ne $labelProperty -and $null -ne $labelProperty.Value) {
                $actualLabelValue = [string]$labelProperty.Value
            }
        }

        return [pscustomobject]@{
            ContainerId = $containerId.Trim()
            Status = $status.Trim()
            LabelValue = $actualLabelValue.Trim()
            Source = 'DOCKER_INSPECT_JSON'
        }
    }

    # Compatibility with the focused unit fixtures that predate the JSON authority.
    # Production Docker is never invoked with --format by this module anymore.
    $line = @(
        $raw -split '\r?\n' |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    ) | Select-Object -First 1
    $parts = @($line -split '\|', 3)
    if ($parts.Count -lt 2 -or [string]::IsNullOrWhiteSpace($parts[0]) -or
        [string]::IsNullOrWhiteSpace($parts[1])) {
        throw '[DOCKER_INSPECT_INVALID_OUTPUT] Estado legado invalido retornado para o probe.'
    }

    return [pscustomobject]@{
        ContainerId = $parts[0].Trim()
        Status = $parts[1].Trim()
        LabelValue = $(if ($parts.Count -ge 3) { $parts[2].Trim() } else { '' })
        Source = 'LEGACY_TEST_FIXTURE'
    }
}

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

    $inspect = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'inspect', $Name) `
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
                InspectSource = 'DOCKER_INSPECT_JSON'
            }
        }

        $category = Get-ContabilidadeDockerFailureCategory -Content $inspect.Output
        $detail = Get-ContabilidadeProbeFailureDetail -Result $inspect
        throw "[$category] Nao foi possivel inspecionar o probe '$Name'. Exit code: $($inspect.ExitCode). Docker: $detail"
    }

    $facts = ConvertFrom-ContabilidadeProbeInspectOutput `
        -RawOutput $inspect.StdOut `
        -LabelKey $LabelKey

    return [pscustomobject]@{
        Name = $Name
        Exists = $true
        Owned = ($facts.LabelValue -eq $LabelValue)
        ContainerId = $facts.ContainerId
        Status = $facts.Status
        LabelValue = $facts.LabelValue
        Category = 'CONTAINER_PRESENT'
        ExitCode = $inspect.ExitCode
        InspectSource = $facts.Source
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
        $detail = Get-ContabilidadeProbeFailureDetail -Result $remove
        throw "[PROBE_REMOVE_FAILED][$failureCategory] Falha real ao remover o probe '$Name'. Exit code: $($remove.ExitCode). Docker: $detail"
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
        $detail = Get-ContabilidadeProbeFailureDetail -Result $create
        throw "[PROBE_CREATE_FAILED][$category] Nao foi possivel criar o probe '$Name'. Exit code: $($create.ExitCode). Docker: $detail"
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
