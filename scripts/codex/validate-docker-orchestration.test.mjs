import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsDockerBuildCommand,
  findAmbiguousPowerShellVariableColon,
  findDirectPowerShellDockerInvocations,
} from './validate-docker-orchestration.mjs';

test('aceita mensagens operacionais que apenas mencionam Docker build', () => {
  const deploy = `
Nenhum build sera executado neste servidor.
Write-Ok 'Deploy concluido sem executar Docker build ou limpar cache.'
`;

  assert.equal(containsDockerBuildCommand(deploy), false);
});

test('rejeita comandos docker build e docker buildx reais', () => {
  const commands = [
    'docker build --pull=false .',
    '& docker build .',
    'docker.exe build .',
    'docker buildx build --load .',
  ];

  for (const command of commands) {
    assert.equal(containsDockerBuildCommand(command), true, command);
  }
});

test('detecta variavel PowerShell ambigua imediatamente antes de dois-pontos', () => {
  const findings = findAmbiguousPowerShellVariableColon(
    'Write-Host "$DisplayName: status=$($state.Status)"',
  );

  assert.deepEqual(findings, [{
    line: 1,
    variable: 'DisplayName',
    source: 'Write-Host "$DisplayName: status=$($state.Status)"',
  }]);
});

test('aceita delimitacao explicita e qualificadores PowerShell validos', () => {
  const source = `
Write-Host "${'${DisplayName}'}: status=running"
$script:ComposePrefix = @('compose')
$env:ComSpec
`;

  assert.deepEqual(findAmbiguousPowerShellVariableColon(source), []);
});

test('detecta invocacoes Docker diretas em PowerShell operacional', () => {
  const source = `
& docker rm -f contabilidade-startup-probe *> $null
& $script:DockerCommand image inspect teste
`;

  assert.deepEqual(findDirectPowerShellDockerInvocations(source), [
    { line: 2, source: '& docker rm -f contabilidade-startup-probe *> $null' },
    { line: 3, source: '& $script:DockerCommand image inspect teste' },
  ]);
});

test('aceita wrappers canonicos sem ampersand Docker direto', () => {
  const source = `
Invoke-ContabilidadeDocker -Arguments @('container', 'rm', '--force', $id) -AllowFailure -Quiet
Invoke-ContabilidadeCompose -ComposePrefix $prefix -Arguments @('up', '-d', 'postgres')
`;

  assert.deepEqual(findDirectPowerShellDockerInvocations(source), []);
});
