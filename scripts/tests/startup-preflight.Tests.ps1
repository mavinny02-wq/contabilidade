$modulePath = Join-Path $PSScriptRoot '..\lib\startup-preflight.psm1'
Import-Module $modulePath -Force

Describe 'Startup PowerShell parser preflight' {
    BeforeEach {
        $fixtureRoot = Join-Path $TestDrive 'scripts com espaco'
        New-Item -ItemType Directory -Path $fixtureRoot | Out-Null
    }

    It 'accepts ps1 and psm1 files in a path with spaces' {
        Set-Content -LiteralPath (Join-Path $fixtureRoot 'valid script.ps1') -Value '$value = "ok"'
        Set-Content -LiteralPath (Join-Path $fixtureRoot 'valid module.psm1') -Value 'function Get-Value { "ok" }'

        { Invoke-StartupPowerShellPreflight -ScriptsPath $fixtureRoot } | Should -Not -Throw
    }

    It 'reports file, line and column and fails before tools or builds can run' {
        $events = New-Object System.Collections.Generic.List[string]
        $invalidPath = Join-Path $fixtureRoot 'invalid script.ps1'
        Set-Content -LiteralPath $invalidPath -Value "`$broken = @(`n"

        Mock Write-Host {
            param($Object)
            $events.Add([string]$Object)
        } -ModuleName startup-preflight
        Mock Get-Command {
            $events.Add('tool')
        }

        { Invoke-StartupPowerShellPreflight -ScriptsPath $fixtureRoot } |
            Should -Throw '*Build nao iniciado*'

        ($events -join "`n") | Should -Match ([regex]::Escape($invalidPath))
        ($events -join "`n") | Should -Match ':1:\d+:'
        $events | Should -Not -Contain 'tool'
        Assert-MockCalled Get-Command -Times 0
    }

    It 'keeps parse before Maven, npm and Docker build in the startup entrypoint' {
        $startupPath = Join-Path $PSScriptRoot '..\start-contabilidade.ps1'
        $startup = Get-Content -LiteralPath $startupPath -Raw
        $parseIndex = $startup.IndexOf('Invoke-StartupPowerShellPreflight')

        $parseIndex | Should -BeGreaterThan -1
        $parseIndex | Should -BeLessThan $startup.IndexOf('Find-Java21Home')
        $parseIndex | Should -BeLessThan $startup.IndexOf('Find-NodeHome')
        $parseIndex | Should -BeLessThan $startup.IndexOf("@('-B', 'clean', 'package'")
        $parseIndex | Should -BeLessThan $startup.IndexOf("@('run', 'build')")
        $startup | Should -Not -Match "docker\s+(?:context|buildx)\s+use"
    }

    It 'keeps the production backup verifier parseable' {
        $verifierPath = Join-Path $PSScriptRoot '..\verify-backup.ps1'
        $tokens = $null
        $errors = $null

        [void][System.Management.Automation.Language.Parser]::ParseFile(
            $verifierPath,
            [ref]$tokens,
            [ref]$errors
        )

        @($errors).Count | Should -Be 0
    }
}
