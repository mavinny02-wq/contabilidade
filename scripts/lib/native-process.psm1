function Invoke-NativeProcess {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(Mandatory = $true)]
        [string]$ArgumentString,

        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    $logDirectory = Split-Path -Parent $LogPath
    if (-not [string]::IsNullOrWhiteSpace($logDirectory)) {
        New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $FilePath
    $startInfo.Arguments = $ArgumentString
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    $stdout = New-Object 'System.Collections.Generic.List[string]'
    $stderr = New-Object 'System.Collections.Generic.List[string]'
    $combined = New-Object 'System.Collections.Generic.List[string]'
    $writer = $null

    try {
        $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
        $writer = New-Object System.IO.StreamWriter($LogPath, $false, $utf8WithoutBom)
        $writer.AutoFlush = $true

        if (-not $process.Start()) {
            throw "Nao foi possivel iniciar o processo nativo: $FilePath"
        }

        # ReadLineAsync keeps both redirected pipes draining concurrently.  This avoids the
        # classic deadlock caused by filling one pipe while synchronously reading the other.
        $stdoutRead = $process.StandardOutput.ReadLineAsync()
        $stderrRead = $process.StandardError.ReadLineAsync()

        while ($null -ne $stdoutRead -or $null -ne $stderrRead) {
            $madeProgress = $false

            if ($null -ne $stdoutRead -and $stdoutRead.IsCompleted) {
                $line = $stdoutRead.GetAwaiter().GetResult()
                if ($null -eq $line) {
                    $stdoutRead = $null
                }
                else {
                    $stdout.Add($line)
                    $combined.Add($line)
                    Write-Host $line
                    $writer.WriteLine($line)
                    $stdoutRead = $process.StandardOutput.ReadLineAsync()
                }
                $madeProgress = $true
            }

            if ($null -ne $stderrRead -and $stderrRead.IsCompleted) {
                $line = $stderrRead.GetAwaiter().GetResult()
                if ($null -eq $line) {
                    $stderrRead = $null
                }
                else {
                    $stderr.Add($line)
                    $combined.Add($line)
                    # stderr remains visible and logged; its contents do not define success.
                    [Console]::Error.WriteLine($line)
                    $writer.WriteLine($line)
                    $stderrRead = $process.StandardError.ReadLineAsync()
                }
                $madeProgress = $true
            }

            if (-not $madeProgress) {
                [Threading.Thread]::Sleep(10)
            }
        }

        # EOF on both redirected streams means the child has closed them. WaitForExit is still
        # required before ExitCode is read and protects against losing final buffered output.
        $process.WaitForExit()
        $exitCode = $process.ExitCode

        return [pscustomobject]@{
            ExitCode = $exitCode
            StdOut = [string]::Join([Environment]::NewLine, $stdout)
            StdErr = [string]::Join([Environment]::NewLine, $stderr)
            CombinedOutput = [string]::Join([Environment]::NewLine, $combined)
            Succeeded = ($exitCode -eq 0)
        }
    }
    finally {
        if ($null -ne $writer) {
            $writer.Dispose()
        }
        $process.Dispose()
    }
}

function Invoke-CmdCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandLine,

        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    if ([string]::IsNullOrWhiteSpace($env:ComSpec)) {
        throw 'A variavel ComSpec nao aponta para cmd.exe.'
    }

    # With /s, cmd.exe removes exactly the outer quotes after /c. Quotes belonging to paths and
    # values inside CommandLine are consequently preserved, as are pipes and other CMD operators.
    $cmdArguments = '/d /s /c "' + $CommandLine + '"'
    Invoke-NativeProcess -FilePath $env:ComSpec -ArgumentString $cmdArguments -LogPath $LogPath
}

Export-ModuleMember -Function Invoke-NativeProcess, Invoke-CmdCommand
