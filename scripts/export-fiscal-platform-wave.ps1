$ErrorActionPreference = "Stop"

# ====================== EDIT THESE VALUES ======================
$Repository = "C:\work\worktrees\fiscal-platform-release-1.0.0"
$Branch = "release/1.0.0"
# ===============================================================

$OutputDirectory = Join-Path $Repository "retorno"
$StateDirectory = Join-Path $env:LOCALAPPDATA "Fiscal-Platform"
$StateFile = Join-Path $StateDirectory "last-successful-wave-export-head.txt"
$EvidenceZip = Join-Path $OutputDirectory "fiscal-platform-wave-evidence.zip"
$DocsZip = Join-Path $OutputDirectory "fiscal-platform-docs-editable.zip"
$EvidenceStage = Join-Path $env:TEMP ("fiscal-wave-evidence-" + [guid]::NewGuid())
$DocsStage = Join-Path $env:TEMP ("fiscal-docs-editable-" + [guid]::NewGuid())
$EvidenceTempZip = Join-Path $env:TEMP ("fiscal-wave-evidence-" + [guid]::NewGuid() + ".zip")
$DocsTempZip = Join-Path $env:TEMP ("fiscal-docs-editable-" + [guid]::NewGuid() + ".zip")

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    $output = & git -C $Repository @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed:`n$output"
    }
    return $output
}

function Require-CleanTree {
    $status = Invoke-Git status --porcelain
    if ($status) {
        throw "Local changes exist. Nothing was reset, cleaned, stashed or discarded."
    }
}

function Get-WaveBase {
    param([string]$Head)

    if ($env:FISCAL_WAVE_BASE) {
        return @{ Commit = $env:FISCAL_WAVE_BASE; Source = "FISCAL_WAVE_BASE" }
    }

    if (Test-Path -LiteralPath $StateFile) {
        $candidate = (Get-Content -LiteralPath $StateFile -Raw).Trim()
        if ($candidate -and $candidate -ne $Head) {
            & git -C $Repository merge-base --is-ancestor $candidate $Head 2>$null
            if ($LASTEXITCODE -eq 0) {
                return @{ Commit = $candidate; Source = "LAST_SUCCESSFUL_WAVE_EXPORT" }
            }
        }
    }

    $candidate = (& git -C $Repository rev-parse "HEAD~20" 2>$null)
    if ($LASTEXITCODE -eq 0 -and $candidate) {
        return @{ Commit = $candidate.Trim(); Source = "FALLBACK_HEAD_20" }
    }

    $root = (Invoke-Git rev-list --max-parents=0 HEAD | Select-Object -First 1).Trim()
    return @{ Commit = $root; Source = "FALLBACK_ROOT" }
}

function Write-Utf8 {
    param([string]$Path, [object[]]$Content)
    $Content | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Copy-IfExists {
    param([string]$Source, [string]$Destination)
    if (Test-Path -LiteralPath $Source) {
        New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

function Assert-ZipEntries {
    param([string]$ZipPath, [string[]]$Required)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $names = @($zip.Entries.FullName | ForEach-Object { $_.Replace('\','/') })
        foreach ($entry in $Required) {
            if ($names -notcontains $entry) {
                throw "Required ZIP entry missing: $entry"
            }
        }
    }
    finally {
        $zip.Dispose()
    }
}

try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        $sourceTreeGit = "C:\Users\sarah\AppData\Local\Atlassian\SourceTree\git_local\mingw64\bin"
        if (Test-Path $sourceTreeGit) { $env:PATH = "$sourceTreeGit;$env:PATH" }
    }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Git was not found." }
    if (-not (Test-Path -LiteralPath (Join-Path $Repository ".git"))) {
        throw "Worktree not found: $Repository"
    }

    Require-CleanTree
    Invoke-Git fetch origin | Out-Null
    Invoke-Git switch $Branch | Out-Null
    Invoke-Git pull --ff-only origin $Branch | Out-Null
    Require-CleanTree

    $CurrentBranch = (Invoke-Git branch --show-current).Trim()
    $Head = (Invoke-Git rev-parse HEAD).Trim()
    $OriginHead = (Invoke-Git rev-parse "origin/$Branch").Trim()
    if ($CurrentBranch -ne $Branch) { throw "Unexpected branch: $CurrentBranch" }
    if ($Head -ne $OriginHead) { throw "Local HEAD differs from origin/$Branch." }

    $baseInfo = Get-WaveBase -Head $Head
    $Base = $baseInfo.Commit
    & git -C $Repository merge-base --is-ancestor $Base $Head
    if ($LASTEXITCODE -ne 0) { throw "Wave base is not an ancestor of HEAD: $Base" }

    New-Item -ItemType Directory -Path $EvidenceStage, $DocsStage -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $EvidenceStage "snapshot"), (Join-Path $EvidenceStage "hashes") -Force | Out-Null

    Write-Utf8 (Join-Path $EvidenceStage "manifest.txt") @(
        "Fiscal Operations Platform - Wave Evidence Manifest",
        "",
        "Generated UTC: $([DateTime]::UtcNow.ToString('o'))",
        "Repository: $Repository",
        "Branch: $Branch",
        "HEAD: $Head",
        "Origin HEAD: $OriginHead",
        "Base: $Base",
        "Base source: $($baseInfo.Source)",
        "LOCAL_EQUALS_ORIGIN=YES",
        "",
        "No tests, Maven, npm, Playwright or Docker were executed by this exporter."
    )

    Write-Utf8 (Join-Path $EvidenceStage "commits-wave.txt") (Invoke-Git log --reverse --date=iso-strict '--format=%H|%ad|%P|%s' "$Base..$Head")
    Write-Utf8 (Join-Path $EvidenceStage "commits-first-parent.txt") (Invoke-Git log --first-parent --reverse --date=iso-strict '--format=%H|%ad|%s' "$Base..$Head")
    Write-Utf8 (Join-Path $EvidenceStage "changed-files.txt") (Invoke-Git diff --name-status "$Base..$Head")
    Write-Utf8 (Join-Path $EvidenceStage "diff-stat.txt") (Invoke-Git diff --stat "$Base..$Head")
    Write-Utf8 (Join-Path $EvidenceStage "diff-numstat.txt") (Invoke-Git diff --numstat "$Base..$Head")
    Write-Utf8 (Join-Path $EvidenceStage "git-diff-check.txt") (& git -C $Repository diff --check "$Base..$Head" 2>&1)
    Write-Utf8 (Join-Path $EvidenceStage "markdown-changed-files.txt") (& git -C $Repository diff --name-status "$Base..$Head" -- '*.md')
    Write-Utf8 (Join-Path $EvidenceStage "markdown-full-diff.txt") (& git -C $Repository diff --no-ext-diff --unified=80 "$Base..$Head" -- '*.md')
    & git -C $Repository diff --binary --full-index "$Base..$Head" | Set-Content -LiteralPath (Join-Path $EvidenceStage "complete-wave.patch") -Encoding UTF8
    Write-Utf8 (Join-Path $EvidenceStage "final-git-status.txt") (Invoke-Git status --short --branch)
    Write-Utf8 (Join-Path $EvidenceStage "final-head.txt") @($Head)
    Write-Utf8 (Join-Path $EvidenceStage "final-origin-head.txt") @($OriginHead)

    $canonical = @(
        "FISCAL_PLATFORM_ROADMAP_ITEM_REGISTRY.md",
        "FISCAL_PLATFORM_PRODUCT_BACKLOG.md",
        "FISCAL_PLATFORM_ORCHESTRATION_BOARD.md",
        "FISCAL_PLATFORM_DELIVERY_HISTORY.md",
        "FISCAL_PLATFORM_FOUNDATION_BACKLOG.md",
        "FISCAL_PLATFORM_ORGANIZATION_BACKLOG.md",
        "FISCAL_PLATFORM_OPERATIONS_BACKLOG.md",
        "FISCAL_PLATFORM_COMPLIANCE_BACKLOG.md",
        "FISCAL_PLATFORM_INTEGRATIONS_BACKLOG.md",
        "FISCAL_PLATFORM_SEARCH_BACKLOG.md",
        "FISCAL_PLATFORM_ADMINISTRATION_BACKLOG.md",
        "FISCAL_PLATFORM_INTELLIGENCE_BACKLOG.md"
    )
    foreach ($name in $canonical) {
        Copy-IfExists (Join-Path $Repository "docs\roadmap\$name") (Join-Path $EvidenceStage "snapshot\$name")
    }
    Copy-IfExists (Join-Path $Repository "backend\pom.xml") (Join-Path $EvidenceStage "snapshot\backend-pom.xml")
    Copy-IfExists (Join-Path $Repository "frontend\package.json") (Join-Path $EvidenceStage "snapshot\frontend-package.json")
    Copy-IfExists (Join-Path $Repository "frontend\package-lock.json") (Join-Path $EvidenceStage "snapshot\frontend-package-lock.json")
    Copy-IfExists (Join-Path $Repository ".fiscal-orchestrator\output\wave-plan.json") (Join-Path $EvidenceStage "snapshot\wave-plan.json")

    $migrationDirectory = Join-Path $Repository "backend\src\main\resources\db\migration"
    if (Test-Path -LiteralPath $migrationDirectory) {
        $hashes = Get-ChildItem -LiteralPath $migrationDirectory -File | Sort-Object Name | ForEach-Object {
            "$($_.Name)|$($_.Length)|$((Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant())"
        }
        Write-Utf8 (Join-Path $EvidenceStage "hashes\flyway-files-sha256.txt") $hashes
    }

    Copy-Item -LiteralPath (Join-Path $Repository "docs") -Destination (Join-Path $DocsStage "docs") -Recurse -Force
    $agentPaths = @(& git -C $Repository ls-files -- 'AGENTS.md' ':(glob)**/AGENTS.md')
    foreach ($relative in ($agentPaths | Sort-Object -Unique)) {
        if ([string]::IsNullOrWhiteSpace($relative)) { continue }
        Copy-IfExists (Join-Path $Repository $relative) (Join-Path $DocsStage $relative)
    }
    if (Test-Path -LiteralPath (Join-Path $Repository ".fiscal-orchestrator")) {
        Copy-Item -LiteralPath (Join-Path $Repository ".fiscal-orchestrator") -Destination (Join-Path $DocsStage ".fiscal-orchestrator") -Recurse -Force
    }

    Write-Utf8 (Join-Path $DocsStage "docs-package-manifest.txt") @(
        "Fiscal Operations Platform - Editable Documentation Package",
        "Generated UTC: $([DateTime]::UtcNow.ToString('o'))",
        "Branch: $Branch",
        "HEAD: $Head",
        "Preserve repository-relative paths when applying returned files."
    )
    $docFiles = Get-ChildItem -LiteralPath $DocsStage -File -Recurse | Sort-Object FullName
    Write-Utf8 (Join-Path $DocsStage "docs-file-list.txt") ($docFiles | ForEach-Object { $_.FullName.Substring($DocsStage.Length + 1).Replace('\','/') })
    $docHashes = $docFiles | Where-Object Name -ne "docs-sha256.txt" | ForEach-Object {
        $relative = $_.FullName.Substring($DocsStage.Length + 1).Replace('\','/')
        "$relative|$($_.Length)|$((Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant())"
    }
    Write-Utf8 (Join-Path $DocsStage "docs-sha256.txt") $docHashes

    Compress-Archive -Path (Join-Path $EvidenceStage '*') -DestinationPath $EvidenceTempZip -Force
    Compress-Archive -Path (Join-Path $DocsStage '*') -DestinationPath $DocsTempZip -Force
    Assert-ZipEntries $EvidenceTempZip @("manifest.txt", "complete-wave.patch", "final-head.txt")
    Assert-ZipEntries $DocsTempZip @("docs-package-manifest.txt", "docs-file-list.txt", "docs-sha256.txt", "docs/roadmap/FISCAL_PLATFORM_ROADMAP_ITEM_REGISTRY.md")

    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    $EvidenceNew = "$EvidenceZip.new"
    $DocsNew = "$DocsZip.new"
    Copy-Item -LiteralPath $EvidenceTempZip -Destination $EvidenceNew -Force
    Copy-Item -LiteralPath $DocsTempZip -Destination $DocsNew -Force
    Assert-ZipEntries $EvidenceNew @("manifest.txt", "complete-wave.patch", "final-head.txt")
    Assert-ZipEntries $DocsNew @("docs/roadmap/FISCAL_PLATFORM_ROADMAP_ITEM_REGISTRY.md")
    Move-Item -LiteralPath $EvidenceNew -Destination $EvidenceZip -Force
    Move-Item -LiteralPath $DocsNew -Destination $DocsZip -Force

    Get-ChildItem -LiteralPath $EvidenceStage -Force | Copy-Item -Destination $OutputDirectory -Recurse -Force
    New-Item -ItemType Directory -Path $StateDirectory -Force | Out-Null
    Set-Content -LiteralPath $StateFile -Value $Head -Encoding ASCII

    Write-Host "SUCCESS"
    Write-Host "HEAD: $Head"
    Write-Host "Base: $Base"
    Write-Host "Evidence ZIP: $EvidenceZip"
    Write-Host "Documentation ZIP: $DocsZip"
    Start-Process explorer.exe $OutputDirectory
}
catch {
    Write-Host "ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "No reset, clean, stash or automatic discard was executed."
    try { & git -C $Repository status --short --branch } catch {}
    exit 1
}
finally {
    foreach ($path in @($EvidenceStage, $DocsStage)) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue }
    }
    foreach ($path in @($EvidenceTempZip, $DocsTempZip)) {
        if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Force -ErrorAction SilentlyContinue }
    }
}
