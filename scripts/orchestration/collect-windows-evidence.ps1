#Requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet('dev', 'onpremise')][string]$Mode,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [string]$ProjectPath = (Get-Location).Path,
    [string]$BeforePath = ''
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'windows-evidence-collector.psm1') -Force
exit (Write-WindowsEvidence -Destination $OutputPath -Mode $Mode -ProjectPath $ProjectPath -BeforePath $BeforePath | Select-Object -Last 1)
