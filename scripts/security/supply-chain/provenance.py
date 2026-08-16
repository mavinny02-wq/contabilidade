#!/usr/bin/env python3
"""Emit local, non-publication provenance for an artifact."""
import argparse, hashlib, json, subprocess
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("artifact", type=Path)
p.add_argument("--subject", required=True)
a = p.parse_args()
sha = subprocess.run(["git", "rev-parse", "HEAD"], check=True, text=True, capture_output=True).stdout.strip()
digest = hashlib.sha256(a.artifact.read_bytes()).hexdigest()
print(json.dumps({"subject": a.subject, "sha256": digest, "git_sha": sha, "published": False}, sort_keys=True))
