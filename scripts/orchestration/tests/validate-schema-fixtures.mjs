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
  for (const key of schema.required) if (!(key in document)) errors.push(`campo obrigatório ausente: ${key}`);
  if (document.schemaVersion !== '2.0.0') errors.push('schemaVersion inválida');
  if (document.collectorVersion !== '2.0.0') errors.push('collectorVersion inválida');
  if (!schema.properties.mode.enum.includes(document.mode)) errors.push('mode inválido');
  if (!/^[a-f0-9]{64}$/.test(document.platform?.machineNameHash ?? '')) errors.push('hash inválido');
  if (Number.isNaN(Date.parse(document.collectedAtUtc ?? ''))) errors.push('data inválida');
  if (Object.keys(document).some((key) => !schema.required.includes(key))) errors.push('campo adicional');
  return errors;
}
assert.deepEqual(validate(valid), []);
assert.ok(validate(invalid).length >= 10);
const serialized = JSON.stringify(valid);
assert.doesNotMatch(serialized, /password|bearer|private key|certificate|C:\\\\Users/i);
console.log('Fixtures válidas/inválidas e redaction estrutural validadas.');
