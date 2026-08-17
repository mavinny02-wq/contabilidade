import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const absolute = (path) => resolve(repositoryRoot, path);
const read = (path) => readFileSync(absolute(path), 'utf8');

export function containsDockerBuildCommand(source) {
  return source.split(/\r?\n/).some((line) => (
    /^\s*(?:&\s*)?docker(?:\.exe)?\s+(?:build(?:\s|$)|buildx(?:\s+build)?(?:\s|$))/i.test(line)
  ));
}

export function validateDockerOrchestration({
  rootBat,
  coreBat,
  resilient,
  dockerModule,
  sequentialBat,
  sequential,
  databaseValidation,
  deploy,
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
  assert.doesNotMatch(coreBat, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(resilient, /contabilidade-docker\.psm1/i);
  assert.match(resilient, /BUILDX_BUILDER/i);
  assert.match(resilient, /failed to prepare extraction snapshot/i);
  assert.match(resilient, /CoreSourceBat/i);
  assert.match(resilient, /TemporaryCoreBat/i);
  assert.doesNotMatch(resilient, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(dockerModule, /Invoke-ContabilidadeNativeCommand/i);
  assert.match(dockerModule, /\$LASTEXITCODE/i);
  assert.match(dockerModule, /docker-container/i);
  assert.match(dockerModule, /default-load=true/i);
  assert.match(dockerModule, /buildx', 'use'/i);
  assert.match(dockerModule, /--bootstrap/i);
  assert.match(dockerModule, /quebrado ou inacessivel/i);
  assert.doesNotMatch(dockerModule, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(sequentialBat, /start-compose-sequential\.ps1/i);
  assert.match(sequential, /Remove-DevAuthContainers/i);
  assert.match(sequential, /Keycloak e bootstrap omitidos/i);
  assert.match(sequential, /KEYCLOAK_STARTUP_TIMEOUT_SECONDS/i);
  assert.match(sequential, /600/);
  assert.match(sequential, /--no-deps/i);
  assert.match(sequential, /--force-recreate/i);
  assert.doesNotMatch(sequential, /compose[^\r\n]*\bdown\b/i);
  assert.doesNotMatch(sequential, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(databaseValidation, /Modo dev: autenticacao desabilitada/i);
  assert.match(databaseValidation, /goto :validate_flyway/i);

  assert.match(deploy, /build:\s+null/i);
  assert.match(deploy, /start-compose-sequential\.bat/i);
  assert.equal(containsDockerBuildCommand(deploy), false, 'deploy on-premise nao pode executar docker build/buildx');
  assert.doesNotMatch(deploy, /buildx|docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateDockerOrchestration({
    rootBat: read('START_CONTABILIDADE.bat'),
    coreBat: read('scripts/start-contabilidade-core.bat'),
    resilient: read('scripts/start-contabilidade-resilient.ps1'),
    dockerModule: read('scripts/lib/contabilidade-docker.psm1'),
    sequentialBat: read('scripts/start-compose-sequential.bat'),
    sequential: read('scripts/start-compose-sequential.ps1'),
    databaseValidation: read('scripts/validate-database-state.bat'),
    deploy: read('scripts/deploy-contabilidade-onpremise.ps1'),
  });

  console.log(JSON.stringify({
    status: 'OK',
    contracts: [
      'um unico BAT oficial na raiz',
      'modo dev sem Keycloak ou bootstrap',
      'startup incremental sem docker compose down',
      'builder isolado docker-container',
      'recuperacao restrita ao builder da aplicacao',
      'deploy on-premise sem build',
    ],
  }, null, 2));
}
