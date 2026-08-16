import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { validarRegistro } from "../validate-migration-registry.mjs";

const checksum = (conteudo) => createHash("sha256").update(conteudo).digest("hex");

async function cenario(migrations, arquivos) {
  const raiz = await mkdtemp(path.join(tmpdir(), "migration-guard-"));
  const diretorioMigracoes = path.join(raiz, "migration");
  await mkdir(diretorioMigracoes);
  for (const [nome, conteudo] of Object.entries(arquivos)) await writeFile(path.join(diretorioMigracoes, nome), conteudo);
  const arquivoRegistro = path.join(raiz, "registry.json");
  await writeFile(arquivoRegistro, JSON.stringify({ schemaVersion: 1, migrations }));
  return { diretorioMigracoes, arquivoRegistro };
}

test("aceita inventário íntegro", async () => {
  const conteudo = "select 1;\n";
  const entrada = { version: 1, arquivo: "V1__inicio.sql", sha256: checksum(conteudo) };
  const resultado = await validarRegistro(await cenario([entrada], { [entrada.arquivo]: conteudo }));
  assert.deepEqual(resultado, { total: 1, primeira: 1, ultima: 1 });
});

test("rejeita versão duplicada", async () => {
  const arquivos = { "V1__inicio.sql": "select 1;\n", "V1__outra.sql": "select 2;\n" };
  const caminhos = await cenario([], arquivos);
  await assert.rejects(() => validarRegistro(caminhos), /Versão de migração duplicada: V1/);
});

test("rejeita inclusão retrógrada fora do registro", async () => {
  const atual = "select 2;\n";
  const migrations = [{ version: 2, arquivo: "V2__atual.sql", sha256: checksum(atual) }];
  const arquivos = { "V1__tardia.sql": "select 1;\n", "V2__atual.sql": atual };
  const caminhos = await cenario(migrations, arquivos);
  await assert.rejects(() => validarRegistro(caminhos), /Migração retrógrada: V1__tardia\.sql/);
});
