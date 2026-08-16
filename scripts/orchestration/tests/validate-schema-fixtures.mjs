import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(here, '../schemas/windows-evidence.schema.json'), 'utf8'));
const valid = JSON.parse(readFileSync(join(here, 'fixtures/windows-evidence.valid.json'), 'utf8'));
const invalid = JSON.parse(readFileSync(join(here, 'fixtures/windows-evidence.invalid.json'), 'utf8'));

function validate(document) {
  const errors = [];
  for (const key of schema.required) {
    if (!(key in document)) errors.push(`campo obrigatório ausente: ${key}`);
  }
  if (document.schemaVersion !== schema.properties.schemaVersion.const) errors.push('schemaVersion inválida');
  if (!/^\d+\.\d+\.\d+$/.test(document.collectorVersion ?? '')) errors.push('collectorVersion inválida');
  if (!document.platform || !/^[a-f0-9]{64}$/.test(document.platform.machineNameHash ?? '')) errors.push('hash de máquina inválido');
  if (Number.isNaN(Date.parse(document.collectedAtUtc ?? ''))) errors.push('data inválida');
  return errors;
}

assert.deepEqual(validate(valid), []);
assert.ok(validate(invalid).length >= 4, 'o fixture inválido deveria violar o contrato');
console.log('Fixtures do schema de evidências validados.');
