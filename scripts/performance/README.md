# Artifact performance budgets

This owner measures build output size only. It does not measure or claim runtime performance,
latency, throughput, browser behavior, or provider behavior.

From the repository root, build all three components and collect a report:

```bash
python3 scripts/performance/artifact_budget.py measure \
  --source-sha "$(git rev-parse HEAD)" --output /tmp/artifacts.json
python3 scripts/performance/artifact_budget.py guard \
  --policy scripts/performance/artifact-budgets.json --current /tmp/artifacts.json
```

For a repeatability check, remove the three generated output directories, repeat each build and
measurement, then compare both reports:

```bash
python3 scripts/performance/artifact_budget.py reproducible \
  --first /tmp/artifacts-1.json --second /tmp/artifacts-2.json
```

The comparison ignores only the JAR SHA and the diagnostic largest-entry list. Maven's executable
JAR embeds changing ZIP timestamps, so its raw hash changes between otherwise identical clean
builds. Both raw hashes should remain in evidence. All scalar size and count metrics must match.

Budget exceptions belong in `artifact-budgets.json` and require `component`, `metric`, `owner`,
`reason`, and an inclusive ISO `expires` date. An expired or incomplete exception never bypasses a
failure. Reports contain repository-relative artifact labels rather than personal paths.
