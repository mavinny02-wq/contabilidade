import assert from 'node:assert/strict';
import test from 'node:test';
import { batSection, validateStartupActions } from './validate-startup-actions.mjs';

const valid = {
  rootBat: `
:run_dev
call dev
:run_build
set "CONTABILIDADE_BUILD_ONLY=1"
powershell start-contabilidade-resilient.ps1
:run_start
powershell invoke-startup-runtime-preflight.ps1
call scripts\\start-compose-sequential.bat dev
:run_check
powershell check-contabilidade.ps1
:run_doctor
powershell doctor-contabilidade.ps1
:finish
`,
  coreBat: `
if /i "%CONTABILIDADE_BUILD_ONLY%"=="1" goto :build_only_success
call "%PROJECT_DIR%\\scripts\\start-compose-sequential.bat" "%MODE%"
:build_only_success
Imagens runtime criadas e verificadas. Docker Compose nao foi iniciado
`,
  checkScript: `backend-test-compile
frontend-typecheck
worker-typecheck`,
  doctorScript: `Invoke-StartupPowerShellPreflight
Assert-ContabilidadeDockerAvailable
'config', '--quiet'
@('image', 'inspect', $image)`,
};

test('extrai somente a secao BAT solicitada', () => {
  assert.match(batSection(valid.rootBat, 'run_start'), /start-compose-sequential/);
  assert.doesNotMatch(batSection(valid.rootBat, 'run_start'), /check-contabilidade/);
});

test('aceita contratos separados', () => {
  assert.doesNotThrow(() => validateStartupActions(valid));
});

test('rejeita compilacao dentro do start puro', () => {
  const broken = { ...valid, rootBat: valid.rootBat.replace(
    'call scripts\\start-compose-sequential.bat dev',
    'call npm run build\ncall scripts\\start-compose-sequential.bat dev',
  ) };
  assert.throws(() => validateStartupActions(broken), /start deve apenas subir/);
});

test('rejeita Compose dentro do check', () => {
  const broken = { ...valid, checkScript: valid.checkScript + '\ndocker compose up -d' };
  assert.throws(() => validateStartupActions(broken), /check nao pode acessar Docker/);
});

test('rejeita mutacao dentro do doctor', () => {
  const broken = { ...valid, doctorScript: valid.doctorScript + "\n@('pull', $image)" };
  assert.throws(() => validateStartupActions(broken), /doctor deve ser read-only/);
});
