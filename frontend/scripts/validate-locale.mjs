import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const localePath = path.join(root, 'src', 'i18n', 'pt-BR.json');
const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));

const hasPath = (object, dottedPath) =>
  dottedPath.split('.').every((part) => {
    if (object && Object.prototype.hasOwnProperty.call(object, part)) {
      object = object[part];
      return true;
    }
    return false;
  });

const sourceFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full);
  }
};
walk(path.join(root, 'src'));

const missing = new Set();
const pattern = /\bt\(\s*['"`]([^'"`]+)['"`]/g;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(pattern)) {
    if (!hasPath(locale, match[1])) missing.add(match[1]);
  }
}

if (missing.size > 0) {
  console.error('Chaves i18n ausentes:');
  for (const key of [...missing].sort()) console.error(`- ${key}`);
  process.exit(1);
}

console.log(`Bundle pt-BR válido. ${sourceFiles.length} arquivos verificados.`);
