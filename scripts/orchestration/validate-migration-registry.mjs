#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const diretorioPadrao = path.join(raiz, "backend/src/main/resources/db/migration");
const registroPadrao = path.join(raiz, "backend/src/main/resources/db/migration-registry.json");
const padraoNome = /^V([1-9]\d*)__([a-z0-9_]+)\.sql$/;
const padraoSha256 = /^[a-f0-9]{64}$/;

export async function validarRegistro({
  diretorioMigracoes = diretorioPadrao,
  arquivoRegistro = registroPadrao,
} = {}) {
  const registro = JSON.parse(await readFile(arquivoRegistro, "utf8"));
  if (registro.schemaVersion !== 1 || !Array.isArray(registro.migrations)) {
    throw new Error("Registro de migrações inválido: schemaVersion 1 e migrations são obrigatórios.");
  }

  const arquivos = (await readdir(diretorioMigracoes)).filter((nome) => nome.endsWith(".sql"));
  const porVersao = new Map();
  for (const arquivo of arquivos) {
    const correspondencia = padraoNome.exec(arquivo);
    if (!correspondencia) throw new Error(`Nome de migração inválido: ${arquivo}.`);
    const versao = Number(correspondencia[1]);
    if (porVersao.has(versao)) {
      throw new Error(`Versão de migração duplicada: V${versao} (${porVersao.get(versao)} e ${arquivo}).`);
    }
    porVersao.set(versao, arquivo);
  }

  const versoesRegistradas = new Set();
  let versaoAnterior = 0;
  for (const item of registro.migrations) {
    if (!Number.isSafeInteger(item.version) || item.version <= 0 || !padraoSha256.test(item.sha256 ?? "")) {
      throw new Error(`Entrada inválida no registro para ${item.arquivo ?? "arquivo não informado"}.`);
    }
    if (versoesRegistradas.has(item.version)) throw new Error(`Versão duplicada no registro: V${item.version}.`);
    if (item.version <= versaoAnterior) throw new Error(`Versão retrógrada no registro: V${item.version} após V${versaoAnterior}.`);
    versoesRegistradas.add(item.version);
    versaoAnterior = item.version;

    const versaoNoNome = padraoNome.exec(item.arquivo ?? "");
    if (!versaoNoNome || Number(versaoNoNome[1]) !== item.version) {
      throw new Error(`Arquivo incompatível com a versão V${item.version}: ${item.arquivo}.`);
    }
    if (porVersao.get(item.version) !== item.arquivo) {
      throw new Error(`Migração registrada ausente ou renomeada: ${item.arquivo}.`);
    }
    const conteudo = await readFile(path.join(diretorioMigracoes, item.arquivo));
    const checksum = createHash("sha256").update(conteudo).digest("hex");
    if (checksum !== item.sha256) throw new Error(`Checksum divergente para ${item.arquivo}.`);
  }

  for (const [versao, arquivo] of porVersao) {
    if (!versoesRegistradas.has(versao)) {
      const tipo = versao <= versaoAnterior ? "Migração retrógrada" : "Migração não registrada";
      throw new Error(`${tipo}: ${arquivo}. Atualize o registro na mesma alteração.`);
    }
  }
  return { total: registro.migrations.length, primeira: registro.migrations[0]?.version, ultima: versaoAnterior };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validarRegistro()
    .then(({ total, primeira, ultima }) => console.log(`Registro de migrações válido: ${total} versões (V${primeira}–V${ultima}).`))
    .catch((erro) => {
      console.error(`Falha na governança de migrações: ${erro.message}`);
      process.exitCode = 1;
    });
}
