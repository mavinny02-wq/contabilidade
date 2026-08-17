# Immutable release promotion guard

This directory defines the offline promotion contract. It validates repository version/SHA,
content-addressed component images, SBOM/provenance hashes, the numeric Flyway frontier, rollback
compatibility, evidence references, and governed environment transitions. It never contacts a
registry, rebuilds an image, publishes an artifact, or deploys an environment.

A promotion operator supplies the target environment's already-applied Flyway frontier. Repository
`VERSION`, `HEAD`, and migrations are the default authorities:

```bash
python scripts/release/promotion/promotion_guard.py bundle.json \
  --target-frontier 12 --expected-digests trusted-build-digests.json \
  --now 2026-08-17T00:00:00Z --format json
```

Use `--output` for an atomic handoff artifact. JSON keys, findings, and Markdown findings are sorted,
so identical inputs and authority arguments produce identical output. The report includes only the
bundle hash, status, and findings; it intentionally omits image repositories and registry data.

Exceptions apply only to a nonstandard environment transition. They must declare a non-empty owner
and reason, exactly match the requested `source->target` transition, and expire strictly after the
validation time. They cannot bypass digest, version, SHA, component, evidence, Flyway, or rollback
checks. Registry digest equality and real promotion/rollback remain runtime evidence owned by
STR-REL-002.
