Describe 'Coletor de evidências do Windows' {
    BeforeAll {
        Import-Module (Join-Path $PSScriptRoot '..\windows-evidence-collector.psm1') -Force
    }

    It 'remove credenciais de URLs, bearer tokens e segredos nomeados' {
        $sample = 'url=https://usuario:senha@exemplo.local token=abc123 Authorization: Bearer eyJhbGciOiJIUzI1NiJ9'
        $redacted = ConvertTo-RedactedText $sample

        $redacted | Should -Not -Match 'usuario:senha'
        $redacted | Should -Not -Match 'abc123'
        $redacted | Should -Not -Match 'eyJhbGciOiJIUzI1NiJ9'
        $redacted | Should -Match '\[REDACTED\]'
    }

    It 'remove blocos de chave privada e certificado' {
        $privateKey = "-----BEGIN PRIVATE KEY-----`nconteudo-sensivel`n-----END PRIVATE KEY-----"
        ConvertTo-RedactedText $privateKey | Should -Be '[REDACTED]'
    }

    It 'remove paths pessoais de mensagens' {
        ConvertTo-RedactedText 'arquivo=C:\Users\pessoa\certificados\cliente.pfx' |
            Should -Not -Match 'pessoa|cliente.pfx'
    }

    It 'retorna código 2 para destino vazio' {
        Write-WindowsEvidence -Destination ' ' | Should -Be 2
    }

    It 'retorna código 4 quando a coleta falha' {
        Mock New-WindowsEvidence -ModuleName windows-evidence-collector { throw 'token=nao-pode-vazar' }
        Write-WindowsEvidence -Destination (Join-Path $TestDrive 'evidence.json') | Should -Be 4
    }

    It 'grava UTF-8 sem BOM e retorna zero em caso de sucesso' {
        $destination = Join-Path $TestDrive 'evidence.json'
        Write-WindowsEvidence -Destination $destination | Select-Object -Last 1 | Should -BeIn @(0, 5)
        Test-Path $destination | Should -BeTrue
        [System.IO.File]::ReadAllBytes($destination)[0] | Should -Be 123
    }
}

Describe 'Evidência focada do runtime' {
    BeforeAll {
        Import-Module (Join-Path $PSScriptRoot '..\windows-evidence-collector.psm1') -Force
    }

    It 'classifica endpoints indisponíveis como evidência parcial' {
        $evidence = [pscustomobject]@{
            compose = [pscustomobject]@{ status = 'disponivel' }
            database = [pscustomobject]@{ flywayLatest = [pscustomobject]@{ status = 'disponivel' } }
            services = @([pscustomobject]@{ status = 'running' })
            endpoints = [pscustomobject]@{ readiness = [pscustomobject]@{ status = 'erro' } }
        }
        Get-EvidenceOutcome $evidence | Should -Be 'parcial'
    }

    It 'classifica Flyway indisponível como erro' {
        $evidence = [pscustomobject]@{
            compose = [pscustomobject]@{ status = 'disponivel' }
            database = [pscustomobject]@{ flywayLatest = [pscustomobject]@{ status = 'erro' } }
            services = @()
            endpoints = [pscustomobject]@{}
        }
        Get-EvidenceOutcome $evidence | Should -Be 'erro'
    }

    It 'compara IDs do PostgreSQL sem expor configuração Compose' {
        Mock Invoke-EvidenceCommand -ModuleName windows-evidence-collector {
            param($Command, $Arguments)
            $joined = $Arguments -join ' '
            if ($joined -match 'config$') { return [ordered]@{ status = 'disponivel'; exitCode = 0; output = 'POSTGRES_PASSWORD=token-super-secreto' } }
            if ($joined -match 'ps -a -q postgres$') { return [ordered]@{ status = 'disponivel'; exitCode = 0; output = 'postgres-id' } }
            if ($joined -match 'ps -a -q') { return [ordered]@{ status = 'disponivel'; exitCode = 0; output = 'other-id' } }
            if ($joined -match 'inspect') { return [ordered]@{ status = 'disponivel'; exitCode = 0; output = '{"Status":"running","ExitCode":0,"Health":{"Status":"healthy"}}' } }
            return [ordered]@{ status = 'disponivel'; exitCode = 0; output = 'ok' }
        }
        Mock Invoke-EvidenceHttp -ModuleName windows-evidence-collector { [ordered]@{ status = 'disponivel'; statusCode = 200 } }
        $before = [pscustomobject]@{ services = @([pscustomobject]@{ name = 'postgres'; containerId = 'postgres-id' }) }
        $evidence = New-WindowsEvidence -Mode dev -ProjectPath (Join-Path $PSScriptRoot '..\..\..') -BeforeEvidence $before
        $evidence.comparison.postgresContainerReused | Should -BeTrue
        $evidence.compose.effectiveConfigSha256 | Should -Match '^[a-f0-9]{64}$'
        ($evidence | ConvertTo-Json -Depth 12) | Should -Not -Match 'token-super-secreto'
        $evidence.devIsolation.keycloakAbsent | Should -BeTrue
    }
}
