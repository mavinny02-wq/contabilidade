param(
    [Parameter(Mandatory = $true)][string]$BackendImage,
    [Parameter(Mandatory = $true)][string]$FrontendImage,
    [Parameter(Mandatory = $true)][string]$WorkerImage
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force

Assert-ContabilidadeDockerAvailable

$checks = @(
    [pscustomobject]@{
        Name = 'backend'
        Image = $BackendImage
        Command = 'test -f /app/app.jar && test ! -f /app/pom.xml'
    },
    [pscustomobject]@{
        Name = 'frontend'
        Image = $FrontendImage
        Command = 'test -x /usr/sbin/nginx && test -f /usr/share/nginx/html/index.html'
    },
    [pscustomobject]@{
        Name = 'automation-worker'
        Image = $WorkerImage
        Command = 'test -f /app/dist/index.js && test -d /app/node_modules/playwright && test ! -d /app/src'
    }
)

foreach ($check in $checks) {
    $result = Test-ContabilidadeRuntimeImage `
        -Image $check.Image `
        -DisplayName $check.Name `
        -ValidationCommand $check.Command

    Write-Host "[RUNTIME-IMAGE][$($check.Name)] category=$($result.Category) exit=$($result.ExitCode) image=$($check.Image)"
    if (-not $result.Verified) {
        if (-not [string]::IsNullOrWhiteSpace($result.StdErr)) {
            Write-Warning $result.StdErr.TrimEnd()
        }
        throw "[$($result.Category)] Imagem runtime '$($check.Image)' nao foi validada. Exit code: $($result.ExitCode)."
    }
}

Write-Host '[OK] As tres imagens runtime foram verificadas pelo executor Docker estruturado.' -ForegroundColor Green
