#!/usr/bin/env python3
"""Validate that release-facing versions derive from the root VERSION file."""

from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SEMVER = re.compile(r"[0-9]+\.[0-9]+\.[0-9]+")
IMAGES = ("contabilidade-backend", "contabilidade-frontend", "contabilidade-automation-worker")


class VersionError(Exception):
    pass


def require(condition: bool, code: str, path: Path, correction: str) -> None:
    if not condition:
        raise VersionError(f"{code}: {path}: {correction}")


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise VersionError(f"VERSION_JSON_INVALID: {path}: corrija o JSON ({error})") from error


def validate(root: Path) -> str:
    version_path = root / "VERSION"
    try:
        version = version_path.read_text(encoding="utf-8").strip()
    except OSError as error:
        raise VersionError(f"VERSION_SOURCE_MISSING: {version_path}: crie a fonte canônica VERSION") from error
    require(bool(SEMVER.fullmatch(version)), "VERSION_FORMAT_INVALID", version_path,
            "use SemVer estável no formato X.Y.Z")

    pom_path = root / "backend/pom.xml"
    try:
        pom = ET.parse(pom_path).getroot()
    except (OSError, ET.ParseError) as error:
        raise VersionError(f"VERSION_MAVEN_INVALID: {pom_path}: corrija o pom.xml ({error})") from error
    namespace = {"m": "http://maven.apache.org/POM/4.0.0"}
    maven_version = pom.findtext("m:version", namespaces=namespace)
    require(maven_version == f"{version}-SNAPSHOT", "VERSION_MAVEN_DRIFT", pom_path,
            f"defina a versão do projeto como {version}-SNAPSHOT")

    for relative in ("frontend/package.json", "frontend/package-lock.json",
                     "automation-worker/package.json", "automation-worker/package-lock.json"):
        path = root / relative
        package = load_json(path)
        require(package.get("version") == version, "VERSION_NPM_DRIFT", path,
                f"defina version como {version}")
        if relative.endswith("package-lock.json"):
            require(package.get("packages", {}).get("", {}).get("version") == version,
                    "VERSION_NPM_LOCK_DRIFT", path, f"regenere o lockfile com version {version}")

    compose_path = root / "compose.yaml"
    compose = compose_path.read_text(encoding="utf-8")
    require(re.search(rf"^\s+APP_VERSION:\s*{re.escape(version)}\s*$", compose, re.MULTILINE) is not None,
            "VERSION_IMAGE_ENV_DRIFT", compose_path, f"defina APP_VERSION como {version}")

    deploy_path = root / "scripts/deploy-contabilidade-onpremise.ps1"
    deploy = deploy_path.read_text(encoding="utf-8")
    for image_name in IMAGES:
        require(f'"{image_name}:$version"' in deploy, "VERSION_IMAGE_DRIFT", deploy_path,
                f"derive a tag de {image_name} da variável $version")

    metadata_path = root / "release/release-metadata.template.json"
    metadata = load_json(metadata_path)
    require(metadata.get("version") == "${VERSION}", "VERSION_RELEASE_METADATA_DRIFT", metadata_path,
            "mantenha version como ${VERSION} para materialização a partir da fonte canônica")
    require(metadata.get("sourceSha") == "${GIT_SHA}", "VERSION_RELEASE_SHA_MISSING", metadata_path,
            "mantenha sourceSha como ${GIT_SHA}")
    require(metadata.get("rollback", {}).get("procedure") == "docs/operacao/BUILD_DOCKER_RESILIENTE_E_DEPLOY_PRODUCAO.md",
            "VERSION_RELEASE_ROLLBACK_MISSING", metadata_path, "informe o procedimento de rollback on-premise")
    images = metadata.get("images", {})
    for image_name in IMAGES:
        image = images.get(image_name, {})
        require(image.get("reference") == f"{image_name}:${{VERSION}}", "VERSION_RELEASE_IMAGE_DRIFT",
                metadata_path, f"derive a referência de {image_name} de ${{VERSION}}")
        require(image.get("digest") == "${SHA256_DIGEST}", "VERSION_RELEASE_DIGEST_MISSING",
                metadata_path, f"exija o digest do artefato {image_name}")
    return version


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    try:
        version = validate(args.root.resolve())
    except VersionError as error:
        print(error, file=sys.stderr)
        return 1
    print(f"VERSION_GOVERNANCE_OK: {version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
