import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const absolute = (path) => resolve(repositoryRoot, path);
const read = (path) => readFileSync(absolute(path), 'utf8');

function listFilesRecursively(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listFilesRecursively(path) : [path];
  });
}

export function containsDockerBuildCommand(source) {
  return source.split(/\r?\n/).some((line) => (
    /^\s*(?:&\s*)?docker(?:\.exe)?\s+(?:build(?:\s|$)|buildx(?:\s+build)?(?:\s|$))/i.test(line)
  ));
}

export function findDirectPowerShellDockerInvocations(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const trimmed = line.trim();
    if (/&\s*(?:docker(?:\.exe)?|\$[A-Za-z_][A-Za-z0-9_:]*Docker(?:Command)?)\b/i.test(line)) {
      return [{ line: index + 1, source: trimmed }];
    }
    return [];
  });
}

export function findAmbiguousPowerShellVariableColon(source) {
  const ambiguous = /(?<!`)\$(?!\{)(?!(?:global|local|script|private|env|using):)([A-Za-z_][A-Za-z0-9_]*):(?=[^A-Za-z0-9_]|$)/gi;
  return source.split(/\r?\n/).flatMap((line, index) => (
    [...line.matchAll(ambiguous)].map((match) => ({
      line: index + 1,
      variable: match[1],
      source: line.trim(),
    }))
  ));
}

export function validateDockerOrchestration({
  rootBat,
  startupRuntimePreflight,
  coreBat,
  resilient,
  dockerModule,
  startupProbeModule,
  runtimeImageVerifier,
  startupGateRunner,
  startupDockerIntegration,
  startupComposeIntegration,
  networkDiagnostics,
  sequentialBat,
  sequential,
  databaseValidation,
  deploy,
  startup,
  startupPreflight,
  powerShellSources = [],
}) {
  assert.match(rootBat, /invoke-startup-runtime-preflight\.ps1/i);
  assert.match(rootBat, /start-contabilidade-resilient\.ps1/i);
  assert.match(rootBat, /deploy-contabilidade-onpremise\.ps1/i);
  assert.match(rootBat, /scripts\\maintenance\\liberar-memoria-docker\.bat/i);
  assert.match(rootBat, /if \/i "%ACTION%"=="dev"/i);
  assert.match(rootBat, /if \/i "%ACTION%"=="onpremise"/i);
  const runtimePreflightIndex = rootBat.toLowerCase().indexOf('invoke-startup-runtime-preflight.ps1');
  const resilientIndex = rootBat.toLowerCase().indexOf('start-contabilidade-resilient.ps1');
  assert.ok(runtimePreflightIndex >= 0 && runtimePreflightIndex < resilientIndex, 'preflight runtime deve preceder o wrapper resiliente e qualquer build');

  assert.match(startupRuntimePreflight, /Invoke-StartupPowerShellPreflight/i);
  assert.match(startupRuntimePreflight, /Assert-ContabilidadeDockerAvailable/i);
  assert.match(startupRuntimePreflight, /Get-ContabilidadeActiveDockerContext/i);
  assert.match(startupRuntimePreflight, /Remove-ContabilidadeStartupProbe/i);
  assert.match(startupRuntimePreflight, /antes de qualquer build/i);
  const parseAllIndex = startupRuntimePreflight.indexOf('Invoke-StartupPowerShellPreflight');
  const dockerModuleImportIndex = startupRuntimePreflight.indexOf("lib\\contabilidade-docker.psm1");
  const probeModuleImportIndex = startupRuntimePreflight.indexOf("lib\\startup-probe.psm1");
  assert.ok(parseAllIndex >= 0, 'preflight runtime deve executar parse-all');
  assert.ok(dockerModuleImportIndex > parseAllIndex, 'modulo Docker so pode ser importado depois do parse-all');
  assert.ok(probeModuleImportIndex > parseAllIndex, 'modulo do probe so pode ser importado depois do parse-all');
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(startupRuntimePreflight),
    [],
    'invoke-startup-runtime-preflight.ps1 deve usar somente wrappers canonicos',
  );

  for (const obsoleteRootBat of [
    'START_CONTABILIDADE_CORE.bat',
    'DEPLOY_CONTABILIDADE_ONPREMISE.bat',
    'LIBERAR_MEMORIA_DOCKER.bat',
  ]) {
    assert.equal(
      existsSync(absolute(obsoleteRootBat)),
      false,
      `${obsoleteRootBat} nao deve competir com o START oficial na raiz`,
    );
  }

  assert.match(coreBat, /docker build --pull=false --network=none --progress=plain/i);
  assert.match(coreBat, /echo FROM eclipse-temurin:21-jre/i);
  assert.match(coreBat, /echo FROM nginx:1\.27-alpine/i);
  assert.match(coreBat, /echo FROM mcr\.microsoft\.com\/playwright:v1\.60\.0-noble/i);
  assert.doesNotMatch(coreBat, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(resilient, /Get-ContabilidadeActiveDockerContext/i);
  assert.match(resilient, /Contexto Docker ativo preservado/i);
  assert.match(resilient, /Invoke-DaemonBaseImagePreflight/i);
  assert.match(resilient, /Invoke-ContabilidadeDocker -Arguments @\('pull', \$image\)/i);
  assert.match(resilient, /capture-docker-network-diagnostics\.ps1/i);
  assert.match(resilient, /Docker Desktop > Settings > Docker Engine/i);
  assert.match(resilient, /DNS_DA_REDE_OU_VPN/i);
  assert.match(resilient, /builder', 'prune', '--force'/i);
  assert.match(resilient, /failed to prepare extraction snapshot/i);
  assert.doesNotMatch(resilient, /\$env:BUILDX_BUILDER\s*=/i);
  assert.doesNotMatch(resilient, /@\('buildx',\s*'use'|@\('context',\s*'use'/i);
  assert.doesNotMatch(resilient, /CONTABILIDADE_BUILDKIT_DNS/i);
  assert.doesNotMatch(resilient, /New-ContabilidadeBuildKitConfig|Repair-BuildKitDns|--buildkitd-config/i);
  assert.doesNotMatch(resilient, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(dockerModule, /Invoke-ContabilidadeNativeCommand/i);
  assert.match(dockerModule, /\$ErrorActionPreference\s*=\s*'Continue'/i);
  assert.match(dockerModule, /\$LASTEXITCODE/i);
  assert.match(dockerModule, /Invoke-ContabilidadeCompose/i);
  assert.match(dockerModule, /Test-ContabilidadeDockerContainerAbsent/i);
  assert.match(dockerModule, /Get-ContabilidadeDockerFailureCategory/i);
  assert.match(dockerModule, /Test-ContabilidadeDockerImage/i);
  assert.match(dockerModule, /Test-ContabilidadeRuntimeImage/i);
  assert.match(dockerModule, /RUNTIME_IMAGE_VERIFIED/i);
  assert.match(dockerModule, /DOCKER_CLI_UNAVAILABLE/i);
  assert.match(dockerModule, /DOCKER_DAEMON_UNAVAILABLE/i);
  assert.match(dockerModule, /Get-ContabilidadeActiveDockerContext/i);
  assert.match(dockerModule, /@\('context', 'show'\)/i);
  assert.match(dockerModule, /Test-ContabilidadeDockerDnsFailure/i);
  assert.doesNotMatch(dockerModule, /@\('buildx',\s*'use'|@\('context',\s*'use'/i);
  assert.doesNotMatch(dockerModule, /Use-ContabilidadeDefaultBuilder|Remove-ContabilidadeLegacyIsolatedBuilder/i);
  assert.doesNotMatch(dockerModule, /GetAllNetworkInterfaces|New-ContabilidadeBuildKitConfig|CONTABILIDADE_BUILDKIT_DNS/i);
  assert.doesNotMatch(dockerModule, /--buildkitd-config|\[dns\]/i);
  assert.doesNotMatch(dockerModule, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(startupProbeModule, /contabilidade\.local\.startup-probe/i);
  assert.match(startupProbeModule, /PROBE_NAME_OWNERSHIP_CONFLICT/i);
  assert.match(startupProbeModule, /CONCURRENT_REMOVAL_EXPECTED/i);
  assert.match(startupProbeModule, /PROBE_CREATE_FAILED/i);
  assert.match(startupProbeModule, /PROBE_REMOVE_FAILED/i);
  assert.match(startupProbeModule, /container', 'rm', '--force', \$state\.ContainerId/i);
  assert.match(startupProbeModule, /Invoke-ContabilidadeWithProbeCleanup/i);
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(startupProbeModule),
    [],
    'startup-probe.psm1 nao pode contornar o executor Docker canonico',
  );

  assert.match(runtimeImageVerifier, /Assert-ContabilidadeDockerAvailable/i);
  assert.match(runtimeImageVerifier, /Test-ContabilidadeRuntimeImage/i);
  assert.match(runtimeImageVerifier, /RUNTIME-IMAGE/i);
  assert.match(runtimeImageVerifier, /backend/i);
  assert.match(runtimeImageVerifier, /frontend/i);
  assert.match(runtimeImageVerifier, /automation-worker/i);
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(runtimeImageVerifier),
    [],
    'verify-runtime-images.ps1 deve usar somente o executor Docker canonico',
  );

  assert.match(startupGateRunner, /RunDockerIntegration/i);
  assert.match(startupGateRunner, /RunComposeIntegration/i);
  assert.match(startupGateRunner, /RunOfficialStartup/i);
  assert.match(startupGateRunner, /startup-reliability-evidence\.json/i);
  assert.match(startupGateRunner, /official-startup-attempt-\$attempt\.log/i);
  assert.match(startupGateRunner, /for \(\$attempt = 1; \$attempt -le 2;/i);

  assert.match(startupDockerIntegration, /contabilidade\.test-suite=startup-reliability/i);
  assert.match(startupDockerIntegration, /contabilidade\.test-run/i);
  assert.match(startupDockerIntegration, /concurrent-removal/i);
  assert.match(startupDockerIntegration, /PROBE_NAME_OWNERSHIP_CONFLICT/i);
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(startupDockerIntegration),
    [],
    'startup-docker-integration.ps1 deve usar wrappers canonicos',
  );

  assert.match(startupComposeIntegration, /contabilidade-startup-it-/i);
  assert.match(startupComposeIntegration, /!override/i);
  assert.match(startupComposeIntegration, /startup_reliability_marker/i);
  assert.match(startupComposeIntegration, /postgresReused/i);
  assert.match(startupComposeIntegration, /down', '--volumes', '--remove-orphans'/i);
  assert.match(startupComposeIntegration, /SkipDatabaseValidation/i);
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(startupComposeIntegration),
    [],
    'startup-compose-integration.ps1 deve usar wrappers canonicos',
  );

  assert.match(networkDiagnostics, /host resolver/i);
  assert.match(networkDiagnostics, /Docker container resolver/i);
  assert.match(networkDiagnostics, /BuildKit resolver/i);
  assert.match(networkDiagnostics, /registry-1\.docker\.io/i);
  assert.match(networkDiagnostics, /mcr\.microsoft\.com/i);
  assert.match(networkDiagnostics, /docker config|proxy values|credentials/i);
  assert.doesNotMatch(networkDiagnostics, /Get-ChildItem\s+Env:|docker\s+info\s*$/im);
  assert.doesNotMatch(networkDiagnostics, /8\.8\.8\.8|1\.1\.1\.1/i);

  assert.match(sequentialBat, /verify-runtime-images\.ps1/i);
  assert.match(sequentialBat, /\[TRANSITION\] Imagens verificadas/i);
  assert.match(sequentialBat, /start-compose-sequential\.ps1/i);
  assert.match(sequential, /Import-Module[^\r\n]*contabilidade-docker\.psm1/i);
  assert.match(sequential, /Import-Module[^\r\n]*startup-probe\.psm1/i);
  assert.match(sequential, /Assert-ContabilidadeDockerAvailable/i);
  assert.match(sequential, /Invoke-ContabilidadeCompose/i);
  assert.match(sequential, /Remove-ContabilidadeStartupProbe/i);
  assert.match(sequential, /Start-ContabilidadeStartupProbe/i);
  assert.match(sequential, /Invoke-ContabilidadeWithProbeCleanup/i);
  assert.match(sequential, /Remove-DevAuthContainers/i);
  assert.match(sequential, /Keycloak e bootstrap omitidos/i);
  assert.match(sequential, /KEYCLOAK_STARTUP_TIMEOUT_SECONDS/i);
  assert.match(sequential, /600/);
  assert.match(sequential, /--no-deps/i);
  assert.match(sequential, /--force-recreate/i);
  assert.match(sequential, /Write-Host "\$\{DisplayName\}: status=/i);
  assert.match(sequential, /\[PROBE\]\[\$Phase\] category=/i);
  assert.match(sequential, /SkipDatabaseValidation so e permitido em projeto efemero/i);
  assert.deepEqual(
    findDirectPowerShellDockerInvocations(sequential),
    [],
    'start-compose-sequential.ps1 deve usar somente o executor Docker canonico',
  );
  assert.doesNotMatch(sequential, /&\s*docker|2>\s*\$null|\*>\s*\$null/i);
  assert.doesNotMatch(sequential, /compose[^\r\n]*\bdown\b/i);
  assert.doesNotMatch(sequential, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  for (const { path, source } of powerShellSources) {
    const findings = findAmbiguousPowerShellVariableColon(source);
    assert.deepEqual(
      findings,
      [],
      `${path} contem interpolacao PowerShell ambigua; use \${variavel}: antes de dois-pontos: ${JSON.stringify(findings)}`,
    );
  }

  assert.match(databaseValidation, /Modo dev: autenticacao desabilitada/i);
  assert.match(databaseValidation, /goto :validate_flyway/i);

  assert.match(deploy, /build:\s+null/i);
  assert.match(deploy, /start-compose-sequential\.bat/i);
  assert.equal(containsDockerBuildCommand(deploy), false, 'deploy on-premise nao pode executar docker build/buildx');
  assert.doesNotMatch(deploy, /buildx|docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  const parserPreflightIndex = startup.indexOf('Invoke-StartupPowerShellPreflight');
  assert.notEqual(parserPreflightIndex, -1, 'startup deve executar o parser preflight');
  for (const buildMarker of ['Find-Java21Home', "@('-B', 'clean', 'package'", "@('run', 'build')"]) {
    assert.ok(parserPreflightIndex < startup.indexOf(buildMarker), `parser preflight deve preceder ${buildMarker}`);
  }
  assert.match(startupPreflight, /System\.Management\.Automation\.Language\.Parser/i);
  assert.match(startupPreflight, /Get-ChildItem[^]*-Recurse[^]*\.ps1[^]*\.psm1/i);
  assert.match(startupPreflight, /StartLineNumber[^]*StartColumnNumber[^]*Message/i);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const powerShellSources = listFilesRecursively(absolute('scripts'))
    .filter((path) => /\.(?:ps1|psm1)$/i.test(path))
    .map((path) => ({
      path: path.slice(repositoryRoot.length + 1),
      source: readFileSync(path, 'utf8'),
    }));

  validateDockerOrchestration({
    rootBat: read('START_CONTABILIDADE.bat'),
    startupRuntimePreflight: read('scripts/invoke-startup-runtime-preflight.ps1'),
    coreBat: read('scripts/start-contabilidade-core.bat'),
    resilient: read('scripts/start-contabilidade-resilient.ps1'),
    dockerModule: read('scripts/lib/contabilidade-docker.psm1'),
    startupProbeModule: read('scripts/lib/startup-probe.psm1'),
    runtimeImageVerifier: read('scripts/verify-runtime-images.ps1'),
    startupGateRunner: read('scripts/tests/run-startup-reliability-gate.ps1'),
    startupDockerIntegration: read('scripts/tests/startup-docker-integration.ps1'),
    startupComposeIntegration: read('scripts/tests/startup-compose-integration.ps1'),
    networkDiagnostics: read('scripts/diagnostics/capture-docker-network-diagnostics.ps1'),
    sequentialBat: read('scripts/start-compose-sequential.bat'),
    sequential: read('scripts/start-compose-sequential.ps1'),
    databaseValidation: read('scripts/validate-database-state.bat'),
    deploy: read('scripts/deploy-contabilidade-onpremise.ps1'),
    startup: read('scripts/start-contabilidade.ps1'),
    startupPreflight: read('scripts/lib/startup-preflight.psm1'),
    powerShellSources,
  });

  console.log(JSON.stringify({
    status: 'OK',
    contracts: [
      'um unico BAT oficial na raiz',
      'parser, Docker e probe validados antes de Maven/npm/build',
      'modo dev sem Keycloak ou bootstrap',
      'startup incremental sem docker compose down',
      'contexto Docker ativo preservado como no PRIMA',
      'nenhuma troca automatica de contexto ou builder',
      'um unico executor Docker com exit code como autoridade',
      'verificacao estruturada das tres imagens runtime antes do Compose',
      'probe com ownership por label e remocao por container ID',
      'probe ausente e remocao concorrente classificados como estados idempotentes',
      'cleanup final preserva a causa principal',
      'Pester, Docker lifecycle, Compose duas vezes e BAT oficial no gate integrado',
      'imagens-base preparadas pelo Docker daemon',
      'diagnostico separado de host, container e BuildKit',
      'DNS e proxy governados no Docker Desktop/daemon',
      'nenhum DNS especifico gravado no repositorio',
      'PowerShell sem interpolacao ambigua de variavel antes de dois-pontos',
      'retry unico para corrupcao conhecida de snapshot',
      'deploy on-premise sem build',
    ],
  }, null, 2));
}
