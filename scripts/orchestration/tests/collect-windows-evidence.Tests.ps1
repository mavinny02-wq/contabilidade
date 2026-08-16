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

    It 'não grava valores das variáveis de ambiente observadas' {
        $previous = [Environment]::GetEnvironmentVariable('DOCKER_HOST')
        try {
            [Environment]::SetEnvironmentVariable('DOCKER_HOST', 'tcp://usuario:segredo@host:2375')
            $evidence = New-WindowsEvidence
            $evidence.environment.DOCKER_HOST | Should -BeTrue
            ($evidence | ConvertTo-Json -Depth 8) | Should -Not -Match 'usuario|segredo'
        }
        finally {
            [Environment]::SetEnvironmentVariable('DOCKER_HOST', $previous)
        }
    }

    It 'retorna código 2 para destino vazio' {
        Write-WindowsEvidence -Destination ' ' | Should -Be 2
    }

    It 'retorna código 3 quando o destino não pode ser gravado' {
        Mock New-WindowsEvidence -ModuleName windows-evidence-collector { [ordered]@{ schemaVersion = '1.0.0' } }
        Write-WindowsEvidence -Destination ([System.IO.Path]::GetPathRoot($PSScriptRoot)) | Should -Be 3
    }

    It 'retorna código 4 quando a coleta falha' {
        Mock New-WindowsEvidence -ModuleName windows-evidence-collector { throw 'token=nao-pode-vazar' }
        Write-WindowsEvidence -Destination (Join-Path $TestDrive 'evidence.json') | Should -Be 4
    }

    It 'grava UTF-8 sem BOM e retorna zero em caso de sucesso' {
        $destination = Join-Path $TestDrive 'evidence.json'
        Write-WindowsEvidence -Destination $destination | Select-Object -Last 1 | Should -Be 0
        Test-Path $destination | Should -BeTrue
        [System.IO.File]::ReadAllBytes($destination)[0] | Should -Be 123
    }
}
