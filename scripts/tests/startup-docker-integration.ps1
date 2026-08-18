param(
    [string]$TestImage,
    [string]$EvidencePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$DockerModule = Join-Path $ProjectDir 'scripts\lib\contabilidade-docker.psm1'
$ProbeModule = Join-Path $ProjectDir 'scripts\lib\startup-probe.psm1'
Import-Module $DockerModule -Force
Import-Module $ProbeModule -Force

if ([string]::IsNullOrWhiteSpace($TestImage)) {
    $version = (Get-Content -LiteralPath (Join-Path $ProjectDir 'VERSION') -Raw).Trim()
    $TestImage = "contabilidade-frontend:$version"
}

Assert-ContabilidadeDockerAvailable
$imageState = Test-ContabilidadeDockerImage -Image $TestImage
if (-not $imageState.Available) {
    throw "[ENVIRONMENT_LIMITATION][$($imageState.Category)] Imagem local de teste ausente: $TestImage. Construa as imagens runtime antes do harness."
}

$runId = ([guid]::NewGuid().ToString('N')).Substring(0, 12)
$prefix = "contabilidade-startup-it-$runId"
$testSuiteLabel = 'contabilidade.test-suite=startup-reliability'
$testRunLabel = "contabilidade.test-run=$runId"
$scenarios = New-Object System.Collections.Generic.List[object]

function Add-Scenario {
    param([string]$Name, [string]$Category, [bool]$Passed, [int]$ExitCode = 0)
    $scenarios.Add([pscustomobject]@{
        name = $Name
        category = $Category
        passed = $Passed
        exitCode = $ExitCode
    })
}

function New-TestContainer {
    param(
        [string]$Name,
        [switch]$Running,
        [string]$StartupProbeLabel = 'true'
    )

    $arguments = @('container')
    if ($Running) {
        $arguments += 'run'
        $arguments += '-d'
    }
    else {
        $arguments += 'create'
    }
    $arguments += @(
        '--name', $Name,
        '--label', $testSuiteLabel,
        '--label', $testRunLabel,
        '--label', "contabilidade.local.startup-probe=$StartupProbeLabel",
        '--entrypoint', '/bin/sh',
        $TestImage,
        '-c', 'while :; do sleep 3600; done'
    )

    $result = Invoke-ContabilidadeDocker -Arguments $arguments -AllowFailure -Quiet
    if (-not $result.Success) {
        throw "Falha ao criar container efemero '$Name'. Exit code: $($result.ExitCode)."
    }
    return ($result.StdOut -split '\r?\n' | Select-Object -First 1).Trim()
}

function Remove-TestResourceById {
    param([string]$ContainerId)

    if ([string]::IsNullOrWhiteSpace($ContainerId)) {
        return
    }
    $format = '{{index .Config.Labels "contabilidade.test-run"}}'
    $inspect = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'inspect', '--format', $format, $ContainerId) `
        -AllowFailure `
        -Quiet
    if (-not $inspect.Success) {
        if (Test-ContabilidadeDockerContainerAbsent -Content $inspect.Output) {
            return
        }
        throw "Nao foi possivel validar ownership do recurso efemero '$ContainerId'."
    }
    if ($inspect.StdOut.Trim() -ne $runId) {
        throw "Cleanup recusado: container '$ContainerId' nao pertence ao run '$runId'."
    }
    $remove = Invoke-ContabilidadeDocker -Arguments @('container', 'rm', '--force', $ContainerId) -AllowFailure -Quiet
    if (-not $remove.Success -and -not (Test-ContabilidadeDockerContainerAbsent -Content $remove.Output)) {
        throw "Falha ao remover recurso efemero '$ContainerId'. Exit code: $($remove.ExitCode)."
    }
}

try {
    $absentName = "$prefix-absent"
    $absent = Remove-ContabilidadeStartupProbe -Name $absentName
    if ($absent.Category -ne 'CONTAINER_ABSENT_EXPECTED') {
        throw "Categoria inesperada para probe ausente: $($absent.Category)"
    }
    Add-Scenario -Name 'probe-absent' -Category $absent.Category -Passed $true -ExitCode $absent.ExitCode

    $stoppedName = "$prefix-stopped"
    $null = New-TestContainer -Name $stoppedName
    $stopped = Remove-ContabilidadeStartupProbe -Name $stoppedName
    if ($stopped.Category -ne 'CONTAINER_REMOVED') {
        throw "Categoria inesperada para probe stopped: $($stopped.Category)"
    }
    Add-Scenario -Name 'probe-stopped' -Category $stopped.Category -Passed $true

    $runningName = "$prefix-running"
    $null = New-TestContainer -Name $runningName -Running
    $running = Remove-ContabilidadeStartupProbe -Name $runningName
    if ($running.Category -ne 'CONTAINER_RUNNING_REMOVED') {
        throw "Categoria inesperada para probe running: $($running.Category)"
    }
    Add-Scenario -Name 'probe-running' -Category $running.Category -Passed $true

    $raceName = "$prefix-race"
    $null = New-TestContainer -Name $raceName -Running
    $jobs = @(
        Start-Job -ScriptBlock {
            param($ModulePath, $Name)
            Import-Module $ModulePath -Force
            Remove-ContabilidadeStartupProbe -Name $Name
        } -ArgumentList $ProbeModule, $raceName
        Start-Job -ScriptBlock {
            param($ModulePath, $Name)
            Import-Module $ModulePath -Force
            Remove-ContabilidadeStartupProbe -Name $Name
        } -ArgumentList $ProbeModule, $raceName
    )
    $raceResults = @($jobs | Wait-Job | Receive-Job)
    $jobs | Remove-Job -Force
    $raceCategories = @($raceResults | ForEach-Object { $_.Category })
    if ($raceCategories -notcontains 'CONTAINER_RUNNING_REMOVED' -and
        $raceCategories -notcontains 'CONTAINER_REMOVED') {
        throw "Nenhuma remocao venceu a corrida: $($raceCategories -join ', ')"
    }
    $benignRaceCategories = @('CONCURRENT_REMOVAL_EXPECTED', 'CONTAINER_ABSENT_EXPECTED')
    if (-not ($raceCategories | Where-Object { $benignRaceCategories -contains $_ })) {
        throw "A segunda remocao nao foi classificada como corrida/ausencia benigna: $($raceCategories -join ', ')"
    }
    Add-Scenario -Name 'concurrent-removal' -Category ($raceCategories -join '+') -Passed $true

    $foreignName = "$prefix-foreign"
    $foreignId = New-TestContainer -Name $foreignName -Running -StartupProbeLabel 'false'
    $conflictObserved = $false
    try {
        $null = Remove-ContabilidadeStartupProbe -Name $foreignName
    }
    catch {
        if ($_.Exception.Message -match 'PROBE_NAME_OWNERSHIP_CONFLICT') {
            $conflictObserved = $true
        }
        else {
            throw
        }
    }
    if (-not $conflictObserved) {
        throw 'Container com label alheio nao gerou ownership conflict.'
    }
    $stillPresent = Invoke-ContabilidadeDocker -Arguments @('container', 'inspect', $foreignId) -AllowFailure -Quiet
    if (-not $stillPresent.Success) {
        throw 'Container alheio foi removido indevidamente.'
    }
    Add-Scenario -Name 'ownership-conflict' -Category 'PROBE_NAME_OWNERSHIP_CONFLICT' -Passed $true
    Remove-TestResourceById -ContainerId $foreignId

    $existingImage = Test-ContabilidadeDockerImage -Image $TestImage
    if (-not $existingImage.Available -or $existingImage.Category -ne 'IMAGE_AVAILABLE') {
        throw 'Imagem de teste existente nao foi reconhecida.'
    }
    Add-Scenario -Name 'image-available' -Category $existingImage.Category -Passed $true

    $missingImageName = "contabilidade-startup-missing-$runId:never"
    $missingImage = Test-ContabilidadeDockerImage -Image $missingImageName
    if ($missingImage.Available -or $missingImage.Category -ne 'IMAGE_MISSING') {
        throw "Imagem ausente recebeu classificacao inesperada: $($missingImage.Category)"
    }
    Add-Scenario -Name 'image-missing' -Category $missingImage.Category -Passed $true -ExitCode $missingImage.ExitCode

    $invalid = Invoke-ContabilidadeDocker -Arguments @('container', 'inspect', '--format', '{{.Id}}', "invalid-$runId") -AllowFailure -Quiet
    if ($invalid.Success -or -not (Test-ContabilidadeDockerContainerAbsent -Content $invalid.Output)) {
        throw 'Comando de container ausente nao produziu a assinatura esperada.'
    }
    Add-Scenario -Name 'invalid-container-inspect' -Category 'CONTAINER_ABSENT_EXPECTED' -Passed $true -ExitCode $invalid.ExitCode
}
finally {
    $list = Invoke-ContabilidadeDocker `
        -Arguments @('container', 'ls', '-a', '--filter', "label=contabilidade.test-run=$runId", '--format', '{{.ID}}') `
        -AllowFailure `
        -Quiet
    if ($list.Success) {
        foreach ($containerId in @($list.StdOut -split '\r?\n')) {
            if (-not [string]::IsNullOrWhiteSpace($containerId)) {
                Remove-TestResourceById -ContainerId $containerId.Trim()
            }
        }
    }
}

$leftovers = Invoke-ContabilidadeDocker `
    -Arguments @('container', 'ls', '-a', '--filter', "label=contabilidade.test-run=$runId", '--format', '{{.ID}}') `
    -AllowFailure `
    -Quiet
if (-not $leftovers.Success -or -not [string]::IsNullOrWhiteSpace($leftovers.StdOut)) {
    throw "Recursos efemeros restantes para o run '$runId'."
}

$evidence = [ordered]@{
    runId = $runId
    testImage = $TestImage
    dockerContext = Get-ContabilidadeActiveDockerContext
    scenarios = @($scenarios)
    finalResources = 0
    status = 'PASS'
}

if (-not [string]::IsNullOrWhiteSpace($EvidencePath)) {
    $directory = Split-Path -Parent $EvidencePath
    if (-not [string]::IsNullOrWhiteSpace($directory)) {
        New-Item -ItemType Directory -Force -Path $directory | Out-Null
    }
    $evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $EvidencePath -Encoding UTF8
}

$evidence
