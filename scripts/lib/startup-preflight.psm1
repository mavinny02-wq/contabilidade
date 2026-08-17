function Invoke-StartupPowerShellPreflight {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptsPath
    )

    $resolvedScriptsPath = (Resolve-Path -LiteralPath $ScriptsPath -ErrorAction Stop).Path
    $files = @(Get-ChildItem -LiteralPath $resolvedScriptsPath -Recurse -File -ErrorAction Stop |
        Where-Object { $_.Extension -in @('.ps1', '.psm1') } |
        Sort-Object FullName)

    $parseErrors = New-Object System.Collections.Generic.List[object]
    foreach ($file in $files) {
        $tokens = $null
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile(
            $file.FullName,
            [ref]$tokens,
            [ref]$errors
        )

        foreach ($parseError in $errors) {
            $parseErrors.Add([pscustomobject]@{
                File = $file.FullName
                Line = $parseError.Extent.StartLineNumber
                Column = $parseError.Extent.StartColumnNumber
                Message = $parseError.Message
            })
        }
    }

    if ($parseErrors.Count -gt 0) {
        foreach ($parseError in $parseErrors) {
            Write-Host ("[ERRO] {0}:{1}:{2}: {3}" -f
                $parseError.File,
                $parseError.Line,
                $parseError.Column,
                $parseError.Message) -ForegroundColor Red
        }
        throw "Preflight PowerShell encontrou $($parseErrors.Count) erro(s) de parser. Build nao iniciado."
    }

    Write-Host "[OK] Preflight PowerShell: $($files.Count) script(s) validado(s)." -ForegroundColor Green
}

Export-ModuleMember -Function Invoke-StartupPowerShellPreflight
