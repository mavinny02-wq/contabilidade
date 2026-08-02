param([string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path)

$ErrorActionPreference = "Stop"
$configPath = Join-Path $RepositoryRoot ".fiscal-orchestrator/config.json"
$planPath = Join-Path $RepositoryRoot ".fiscal-orchestrator/output/wave-plan.json"
$schemaPath = Join-Path $RepositoryRoot ".fiscal-orchestrator/schemas/wave-plan.schema.json"

foreach ($path in @($configPath, $planPath, $schemaPath)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Required file not found: $path" }
}

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$plan = Get-Content -LiteralPath $planPath -Raw | ConvertFrom-Json
$null = Get-Content -LiteralPath $schemaPath -Raw | ConvertFrom-Json

if ($config.waves.officialSlotCount -ne 5) { throw "officialSlotCount must remain 5." }
if ($plan.officialSlots.Count -notin @(0,5)) { throw "officialSlots must be empty or contain exactly 5 slots." }
if ($plan.futureOfficialWave.Count -notin @(0,5)) { throw "futureOfficialWave must be empty or contain exactly 5 slots." }

$all = @($plan.officialSlots) + @($plan.futureOfficialWave)
foreach ($slot in $all) {
    if ($slot.dependencies.Count -gt 0) { throw "Same-wave dependency: $($slot.itemId)" }
}

$duplicates = $all | ForEach-Object {
    $item = $_.itemId
    $_.ownedPaths | ForEach-Object { [pscustomobject]@{ Item=$item; Path=$_ } }
} | Group-Object Path | Where-Object Count -gt 1

if ($duplicates) {
    $details = $duplicates | ForEach-Object { "$($_.Name): $($_.Group.Item -join ', ')" }
    throw "Exact owned-path overlap:`n$($details -join "`n")"
}

Write-Host "Orchestration JSON is readable."
Write-Host "Official-slot cardinality is valid."
Write-Host "No declared same-wave dependencies."
Write-Host "No exact owned-path duplicates."
Write-Host "Full JSON Schema validation may be added later without changing this permanent guard."
