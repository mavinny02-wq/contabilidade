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
  coreBat,
  resilient,
  dockerModule,
  networkDiagnostics,
  sequentialBat,
  sequential,
  databaseValidation,
  deploy,
  startup,
  startupPreflight,
  powerShellSources = [],
}) {
  assert.match(rootBat, /start-contabilidade-resilient\.ps1/i);
  assert.match(rootBat, /deploy-contabilidade-onpremise\.ps1/i);
  assert.match(rootBat, /scripts\\maintenance\\liberar-memoria-docker\.bat/i);
  assert.match(rootBat, /if \/i "%ACTION%"=="dev"/i);
  assert.match(rootBat, /if \/i "%ACTION%"=="onpremise"/i);

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
  assert.match(dockerModule, /\$LASTEXITCODE/i);
  assert.match(dockerModule, /Get-ContabilidadeActiveDockerContext/i);
  assert.match(dockerModule, /@\('context', 'show'\)/i);
  assert.match(dockerModule, /Test-ContabilidadeDockerDnsFailure/i);
  assert.doesNotMatch(dockerModule, /@\('buildx',\s*'use'|@\('context',\s*'use'/i);
  assert.doesNotMatch(dockerModule, /Use-ContabilidadeDefaultBuilder|Remove-ContabilidadeLegacyIsolatedBuilder/i);
  assert.doesNotMatch(dockerModule, /GetAllNetworkInterfaces|New-ContabilidadeBuildKitConfig|CONTABILIDADE_BUILDKIT_DNS/i);
  assert.doesNotMatch(dockerModule, /--buildkitd-config|\[dns\]/i);
  assert.doesNotMatch(dockerModule, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(networkDiagnostics, /host resolver/i);
  assert.match(networkDiagnostics, /Docker container resolver/i);
  assert.match(networkDiagnostics, /BuildKit resolver/i);
  assert.match(networkDiagnostics, /registry-1\.docker\.io/i);
  assert.match(networkDiagnostics, /mcr\.microsoft\.com/i);
  assert.match(networkDiagnostics, /docker config|proxy values|credentials/i);
  assert.doesNotMatch(networkDiagnostics, /Get-ChildItem\s+Env:|docker\s+info\s*$/im);
  assert.doesNotMatch(networkDiagnostics, /8\.8\.8\.8|1\.1\.1\.1/i);

  assert.match(sequentialBat, /start-compose-sequential\.ps1/i);
  assert.match(sequential, /Remove-DevAuthContainers/i);
  assert.match(sequential, /Keycloak e bootstrap omitidos/i);
  assert.match(sequential, /KEYCLOAK_STARTUP_TIMEOUT_SECONDS/i);
  assert.match(sequential, /600/);
  assert.match(sequential, /--no-deps/i);
  assert.match(sequential, /--force-recreate/i);
  assert.match(sequential, /Write-Host "\$\{DisplayName\}: status=/i);
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
    coreBat: read('scripts/start-contabilidade-core.bat'),
    resilient: read('scripts/start-contabilidade-resilient.ps1'),
    dockerModule: read('scripts/lib/contabilidade-docker.psm1'),
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
      'modo dev sem Keycloak ou bootstrap',
      'startup incremental sem docker compose down',
      'contexto Docker ativo preservado como no PRIMA',
      'nenhuma troca automatica de contexto ou builder',
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
