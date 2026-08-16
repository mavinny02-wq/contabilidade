#Requires -Version 5.1

[CmdletBinding()]
param(
    [AllowEmptyString()]
    [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'windows-evidence-collector.psm1') -Force
exit (Write-WindowsEvidence -Destination $OutputPath)
