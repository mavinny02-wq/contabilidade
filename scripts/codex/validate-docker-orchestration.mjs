import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(repositoryRoot, path), 'utf8');

export function containsDockerBuildCommand(source) {
  return source.split(/\r?\n/).some((line) => (
    /^\s*(?:&\s*)?docker(?:\.exe)?\s+(?:build(?:\s|$)|buildx(?:\s+build)?(?:\s|$))/i.test(line)
  ));
}

export function validateDockerOrchestration({ rootBat, coreBat, resilient, deployBat, deploy }) {
  assert.match(rootBat, /start-contabilidade-resilient\.ps1/i);
  assert.match(coreBat, /docker build --pull=false --network=none --progress=plain/i);
  assert.doesNotMatch(coreBat, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(resilient, /docker-container/i);
  assert.match(resilient, /default-load=true/i);
  assert.match(resilient, /BUILDX_BUILDER/i);
  assert.match(resilient, /failed to prepare extraction snapshot/i);
  assert.match(resilient, /buildx', 'rm', '--force'/i);
  assert.doesNotMatch(resilient, /docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);

  assert.match(deployBat, /deploy-contabilidade-onpremise\.ps1/i);
  assert.match(deploy, /build:\s+null/i);
  assert.match(deploy, /start-compose-sequential\.bat/i);
  assert.equal(containsDockerBuildCommand(deploy), false, 'deploy on-premise nao pode executar docker build/buildx');
  assert.doesNotMatch(deploy, /buildx|docker\s+(?:system|volume)\s+prune|compose\s+down\s+-v/i);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateDockerOrchestration({
    rootBat: read('START_CONTABILIDADE.bat'),
    coreBat: read('START_CONTABILIDADE_CORE.bat'),
    resilient: read('scripts/start-contabilidade-resilient.ps1'),
    deployBat: read('DEPLOY_CONTABILIDADE_ONPREMISE.bat'),
    deploy: read('scripts/deploy-contabilidade-onpremise.ps1'),
  });

  console.log(JSON.stringify({
    status: 'OK',
    contracts: [
      'builder isolado docker-container',
      'recuperacao restrita ao builder da aplicacao',
      'nenhum prune global ou de volume',
      'deploy on-premise sem build',
    ],
  }, null, 2));
}
