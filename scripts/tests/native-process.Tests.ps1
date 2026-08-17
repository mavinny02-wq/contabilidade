$modulePath = Join-Path $PSScriptRoot '..\lib\native-process.psm1'
Import-Module $modulePath -Force

$isWindowsRuntime = -not [string]::IsNullOrWhiteSpace($env:ComSpec)

Describe 'Invoke-CmdCommand' {
    BeforeEach {
        $script:logPath = Join-Path $TestDrive 'native-process.log'
    }

    It 'captures stdout and exit code zero' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'echo teste' -LogPath $logPath
        $result.Succeeded | Should -BeTrue
        $result.ExitCode | Should -Be 0
        $result.StdOut | Should -Match 'teste'
        (Get-Content $logPath -Raw) | Should -Match 'teste'
    }

    It 'does not turn legitimate stderr into a failure' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'echo mensagem-informativa 1>&2 & exit /b 0' -LogPath $logPath
        $result.Succeeded | Should -BeTrue
        $result.StdErr | Should -Match 'mensagem-informativa'
        (Get-Content $logPath -Raw) | Should -Match 'mensagem-informativa'
    }

    It 'captures stdout and stderr without losing the final lines' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'echo stdout-ok & echo stderr-ok 1>&2 & exit /b 0' -LogPath $logPath
        $result.ExitCode | Should -Be 0
        $result.StdOut | Should -Match 'stdout-ok'
        $result.StdErr | Should -Match 'stderr-ok'
        $result.CombinedOutput | Should -Match 'stdout-ok'
        $result.CombinedOutput | Should -Match 'stderr-ok'
    }

    It 'reports stderr and exit code one as a failure' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'echo falha 1>&2 & exit /b 1' -LogPath $logPath
        $result.Succeeded | Should -BeFalse
        $result.ExitCode | Should -Be 1
        $result.StdErr | Should -Match 'falha'
    }

    It 'preserves a specific nonzero exit code' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'echo falha-controlada 1>&2 & exit /b 7' -LogPath $logPath
        $result.Succeeded | Should -BeFalse
        $result.ExitCode | Should -Be 7
    }

    It 'drains a large volume from both streams without deadlock' -Skip:(-not $isWindowsRuntime) {
        $result = Invoke-CmdCommand -CommandLine 'for /L %i in (1,1,2000) do @(echo out-%i & echo err-%i 1>&2)' -LogPath $logPath
        $result.ExitCode | Should -Be 0
        $result.StdOut | Should -Match 'out-2000'
        $result.StdErr | Should -Match 'err-2000'
    }

    It 'throws when the executable does not exist' {
        { Invoke-NativeProcess -FilePath (Join-Path $TestDrive 'missing-command.exe') -ArgumentString '' -LogPath $logPath } |
            Should -Throw
    }

    It 'preserves a quoted script path and argument containing spaces' -Skip:(-not $isWindowsRuntime) {
        $directory = Join-Path $TestDrive 'caminho com espacos'
        New-Item -ItemType Directory -Path $directory | Out-Null
        $scriptPath = Join-Path $directory 'eco argumentos.cmd'
        '@echo off' + "`r`n" + 'echo valor=[%~1]' | Set-Content -LiteralPath $scriptPath -Encoding Ascii

        $command = 'call "' + $scriptPath + '" "valor com espacos"'
        $result = Invoke-CmdCommand -CommandLine $command -LogPath $logPath

        $result.ExitCode | Should -Be 0
        $result.StdOut | Should -Match 'valor=\[valor com espacos\]'
    }
}
