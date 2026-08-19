import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (path) => readFileSync(resolve(root, path), 'utf8');

export function batSection(source, label) {
  const start = source.search(new RegExp(`(?im)^:${label}\\s*$`));
  if (start < 0) return '';
  const rest = source.slice(start + label.length + 2);
  const next = rest.search(/(?im)^:[A-Za-z0-9_]+\s*$/);
  return next < 0 ? rest : rest.slice(0, next);
}

export function containsBuildCommand(source) {
  return source.split(/\r?\n/).some((line) => (
    /^\s*(?:call\s+)?(?:mvn(?:\.cmd)?|npm(?:\.cmd)?|docker(?:\.exe)?\s+build)\b/i.test(line)
    || /^\s*powershell[^\r\n]*start-contabilidade-resilient\.ps1/i.test(line)
  ));
}

export function validateStartupActions({ rootBat, coreBat, checkScript, doctorScript }) {
  for (const action of ['run_dev', 'run_build', 'run_start', 'run_check', 'run_doctor']) {
    assert.match(rootBat, new RegExp(`(?im)^:${action}\\s*$`), `acao ausente: ${action}`);
  }

  const start = batSection(rootBat, 'run_start');
  assert.match(start, /invoke-startup-runtime-preflight\.ps1/i);
  assert.match(start, /start-compose-sequential\.bat/i);
  assert.equal(containsBuildCommand(start), false,
    'start deve apenas subir imagens existentes');

  const build = batSection(rootBat, 'run_build');
  assert.match(build, /CONTABILIDADE_BUILD_ONLY=1/i);
  assert.match(build, /start-contabilidade-resilient\.ps1/i);
  assert.doesNotMatch(build, /start-compose-sequential\.bat/i,
    'build nao pode iniciar Compose diretamente');

  const check = batSection(rootBat, 'run_check');
  assert.match(check, /check-contabilidade\.ps1/i);
  assert.doesNotMatch(check, /start-compose|start-contabilidade-resilient/i);

  const doctor = batSection(rootBat, 'run_doctor');
  assert.match(doctor, /doctor-contabilidade\.ps1/i);
  assert.doesNotMatch(doctor, /start-compose|start-contabilidade-resilient/i);

  const buildOnly = coreBat.search(/if \/i "%CONTABILIDADE_BUILD_ONLY%"=="1" goto :build_only_success/i);
  const composeStart = coreBat.search(/call "%PROJECT_DIR%\\scripts\\start-compose-sequential\.bat"/i);
  assert.ok(buildOnly >= 0 && buildOnly < composeStart,
    'core deve encerrar build-only antes de chamar Compose');
  assert.match(coreBat, /Imagens runtime criadas e verificadas\. Docker Compose nao foi iniciado/i);

  assert.match(checkScript, /backend-test-compile/i);
  assert.match(checkScript, /frontend-typecheck/i);
  assert.match(checkScript, /worker-typecheck/i);
  assert.doesNotMatch(checkScript, /Invoke-ContabilidadeDocker|docker(?:\.exe)?\s|compose\s+(?:up|down|start|stop)/i,
    'check nao pode acessar Docker');

  assert.match(doctorScript, /Invoke-StartupPowerShellPreflight/i);
  assert.match(doctorScript, /Assert-ContabilidadeDockerAvailable/i);
  assert.match(doctorScript, /'config', '--quiet'/i);
  assert.match(doctorScript, /@\('image', 'inspect', \$image\)/i);
  assert.doesNotMatch(doctorScript,
    /\bmvn\b[^\r\n]*(?:compile|package|verify)|\bnpm\b[^\r\n]*(?:ci|install|run)|compose[^\r\n]*(?:up|down|start|stop)|@\('(pull|rm|run|build|prune)'/i,
    'doctor deve ser read-only');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateStartupActions({
    rootBat: read('START_CONTABILIDADE.bat'),
    coreBat: read('scripts/start-contabilidade-core.bat'),
    checkScript: read('scripts/check-contabilidade.ps1'),
    doctorScript: read('scripts/doctor-contabilidade.ps1'),
  });
  console.log(JSON.stringify({
    status: 'OK',
    contracts: [
      'dev preserva build+start',
      'build cria imagens sem Compose',
      'start sobe sem Maven/npm/compilacao',
      'check compila sem Docker',
      'doctor diagnostica sem mutacao',
    ],
  }, null, 2));
}
