param(
    [Parameter(Mandatory = $true)][string]$BackendImage,
    [Parameter(Mandatory = $true)][string]$FrontendImage,
    [Parameter(Mandatory = $true)][string]$WorkerImage
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

Import-Module (Join-Path $PSScriptRoot 'lib\contabilidade-docker.psm1') -Force

function Get-RuntimeImageDiagnostic {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)]$Result)

    $parts = @(
        @(
            [string]$Result.StdErr
            [string]$Result.StdOut
        ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )

    if ($parts.Count -eq 0) {
        return 'O comando de validacao encerrou sem produzir stdout ou stderr.'
    }

    $detail = ($parts -join [Environment]::NewLine).Trim()
    $detail = [regex]::Replace(
        $detail,
        '(?i)\b(password|passwd|token|secret|client_secret)\s*[:=]\s*[^\s;]+',
        '$1=[REDACTED]'
    )
    $detail = [regex]::Replace(
        $detail,
        '(?i)(https?://)[^\s/@:]+:[^\s/@]+@',
        '$1[REDACTED]@'
    )
    if ($detail.Length -gt 1600) {
        return $detail.Substring(0, 1600) + '...'
    }
    return $detail
}

Assert-ContabilidadeDockerAvailable

# Keep each contract small and free from embedded quote-bearing shell arguments.
# Windows PowerShell 5.1 can alter nested quotes while binding a string argument to docker.exe.
# Nginx syntax is validated after Compose starts, where backend/worker/Keycloak DNS is authoritative.
$checks = @(
    [pscustomobject]@{
        Name = 'backend-files'
        Image = $BackendImage
        Command = 'test -f /app/app.jar && test ! -f /app/pom.xml'
    },
    [pscustomobject]@{
        Name = 'frontend-files'
        Image = $FrontendImage
        Command = 'test -x /usr/sbin/nginx && test -f /usr/share/nginx/html/index.html && test -x /docker-entrypoint.d/40-runtime-config.sh && grep -Fq auth-location.conf /etc/nginx/conf.d/default.conf'
    },
    [pscustomobject]@{
        Name = 'frontend-dev-config'
        Image = $FrontendImage
        Command = 'APP_AUTH_ENABLED=false CONTABILIDADE_NGINX_VALIDATE=false /docker-entrypoint.d/40-runtime-config.sh && grep -Fq authEnabled /usr/share/nginx/html/config.js && grep -Fq false /usr/share/nginx/html/config.js && ! grep -Fiq keycloak /etc/nginx/contabilidade/auth-location.conf'
    },
    [pscustomobject]@{
        Name = 'frontend-auth-config'
        Image = $FrontendImage
        Command = 'APP_AUTH_ENABLED=true CONTABILIDADE_NGINX_VALIDATE=false /docker-entrypoint.d/40-runtime-config.sh && grep -Fq authEnabled /usr/share/nginx/html/config.js && grep -Fq true /usr/share/nginx/html/config.js && grep -Fq proxy_pass /etc/nginx/contabilidade/auth-location.conf && grep -Fq keycloak:8080/auth/ /etc/nginx/contabilidade/auth-location.conf'
    },
    [pscustomobject]@{
        Name = 'automation-worker-files'
        Image = $WorkerImage
        Command = 'test -f /app/dist/index.js && test -d /app/node_modules/playwright && test ! -d /app/src'
    }
)

foreach ($check in $checks) {
    $result = Test-ContabilidadeRuntimeImage `
        -Image $check.Image `
        -DisplayName $check.Name `
        -ValidationCommand $check.Command

    $effectiveCategory = $result.Category
    if ($effectiveCategory -eq 'DOCKER_PERMISSION_OR_API_FAILURE' -and $result.ExitCode -ne 125) {
        $effectiveCategory = 'RUNTIME_IMAGE_VALIDATION_FAILED'
    }

    Write-Host "[RUNTIME-IMAGE][$($check.Name)] category=$effectiveCategory exit=$($result.ExitCode) image=$($check.Image)"
    if (-not $result.Verified) {
        $diagnostic = Get-RuntimeImageDiagnostic -Result $result
        Write-Warning "[RUNTIME-IMAGE][$($check.Name)] $diagnostic"
        throw "[$effectiveCategory] Contrato runtime '$($check.Name)' da imagem '$($check.Image)' falhou. Exit code: $($result.ExitCode). Nenhum servico foi iniciado."
    }
}

Write-Host '[OK] As tres imagens runtime e os cinco contratos de conteudo foram verificados.' -ForegroundColor Green
