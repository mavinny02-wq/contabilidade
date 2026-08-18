$modulePath = Join-Path $PSScriptRoot '..\lib\contabilidade-docker.psm1'
Import-Module $modulePath -Force

$isWindowsRuntime = -not [string]::IsNullOrWhiteSpace($env:ComSpec)

Describe 'Invoke-ContabilidadeNativeCommand under Windows PowerShell semantics' {
    It 'captures stderr with exit zero without raising NativeCommandError' -Skip:(-not $isWindowsRuntime) {
        $scriptPath = Join-Path $TestDrive 'stderr-zero.cmd'
        @(
            '@echo off'
            'echo mensagem-informativa 1>&2'
            'exit /b 0'
        ) | Set-Content -LiteralPath $scriptPath -Encoding Ascii

        $previous = $ErrorActionPreference
        try {
            $ErrorActionPreference = 'Stop'
            $result = Invoke-ContabilidadeNativeCommand `
                -FilePath $env:ComSpec `
                -Arguments @('/d', '/c', ('"' + $scriptPath + '"'))
        }
        finally {
            $ErrorActionPreference = $previous
        }

        $result.Success | Should -BeTrue
        $result.ExitCode | Should -Be 0
        $result.StdErr | Should -Match 'mensagem-informativa'
    }

    It 'captures stderr and preserves a nonzero exit code' -Skip:(-not $isWindowsRuntime) {
        $scriptPath = Join-Path $TestDrive 'stderr-seven.cmd'
        @(
            '@echo off'
            'echo falha-controlada 1>&2'
            'exit /b 7'
        ) | Set-Content -LiteralPath $scriptPath -Encoding Ascii

        $result = Invoke-ContabilidadeNativeCommand `
            -FilePath $env:ComSpec `
            -Arguments @('/d', '/c', ('"' + $scriptPath + '"'))

        $result.Success | Should -BeFalse
        $result.ExitCode | Should -Be 7
        $result.StdErr | Should -Match 'falha-controlada'
    }

    It 'captures stdout and stderr from a path with spaces' -Skip:(-not $isWindowsRuntime) {
        $directory = Join-Path $TestDrive 'native path with spaces'
        New-Item -ItemType Directory -Path $directory | Out-Null
        $scriptPath = Join-Path $directory 'both streams.cmd'
        @(
            '@echo off'
            'echo stdout-ok'
            'echo stderr-ok 1>&2'
            'exit /b 0'
        ) | Set-Content -LiteralPath $scriptPath -Encoding Ascii

        $result = Invoke-ContabilidadeNativeCommand `
            -FilePath $env:ComSpec `
            -Arguments @('/d', '/c', ('"' + $scriptPath + '"'))

        $result.Success | Should -BeTrue
        $result.StdOut | Should -Match 'stdout-ok'
        $result.StdErr | Should -Match 'stderr-ok'
    }

    It 'handles large output on both streams without losing the final lines' -Skip:(-not $isWindowsRuntime) {
        $scriptPath = Join-Path $TestDrive 'large-output.cmd'
        @(
            '@echo off'
            'for /L %%i in (1,1,2000) do @echo out-%%i'
            'for /L %%i in (1,1,2000) do @echo err-%%i 1>&2'
            'exit /b 0'
        ) | Set-Content -LiteralPath $scriptPath -Encoding Ascii

        $result = Invoke-ContabilidadeNativeCommand `
            -FilePath $env:ComSpec `
            -Arguments @('/d', '/c', ('"' + $scriptPath + '"'))

        $result.Success | Should -BeTrue
        $result.StdOut | Should -Match 'out-2000'
        $result.StdErr | Should -Match 'err-2000'
    }
}
