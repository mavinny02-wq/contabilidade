# Fiscal Platform Orchestrator

This directory contains machine-readable and human-readable contracts for independent Codex waves.
It does not call Codex, merge PRs or modify branches autonomously.

## Inputs

- current `release/1.0.0`;
- canonical registry/domain backlogs;
- integrated evidence ZIP;
- editable documentation ZIP;
- active decisions and environment blockers.

## Outputs

- `output/wave-plan.json`;
- bounded prompts under `output/prompts/`;
- overlap/dependency decisions in the Orchestration Board.

## Official wave

Exactly five independent slots, each from the same latest baseline, no same-wave dependency,
non-overlapping critical paths, stable ID, explicit exclusions and no tests.

## Serial gate

A bootstrap serial gate is allowed before the first official wave when the inherited repository must
first become a clean compile-ready baseline. It is not one of the five slots.

## Extras

Urgent extras address one bounded defect/environment blocker. They do not count in the five slots and
cannot overlap them.

## Reconciliation

After intended PRs merge, reconciliation is serialized. It reads actual code/evidence, updates
canonical status, archives completed evidence and creates the next safe plan.
