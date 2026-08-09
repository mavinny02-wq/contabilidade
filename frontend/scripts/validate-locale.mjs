import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const localePath = path.join(root, 'src', 'i18n', 'pt-BR.json');
const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));

const resolvePath = (dottedPath) => {
  let current = locale;
  for (const part of dottedPath.split('.')) {
    if (!current || !Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    current = current[part];
  }
  return current;
};

const hasText = (dottedPath) => {
  const value = resolvePath(dottedPath);
  return typeof value === 'string' && value.trim().length > 0;
};

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
const pattern = /\bt\(\s*(['"`])([^'"`]+)\1/g;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(pattern)) {
    const key = match[2];
    if (key.includes('${') || key.includes('{{')) continue;
    if (!hasText(key)) missing.add(key);
  }
}

const catalogs = {
  'empresas.status': ['ATIVA', 'INATIVA', 'SUSPENSA', 'BAIXADA', 'DESCONHECIDA'],
  'empresas.regimes': [
    'MEI',
    'SIMPLES_NACIONAL',
    'LUCRO_PRESUMIDO',
    'LUCRO_REAL',
    'OUTRO',
    'NAO_INFORMADO',
  ],
  'empresas.abas': [
    'resumo',
    'certidoes',
    'obrigacoes',
    'pendencias',
    'mensagens',
    'guias',
    'documentos',
    'automacao',
    'historico',
  ],
  'documentos.tipos': ['OUTRO', 'CERTIDAO', 'GUIA', 'COMPROVANTE', 'DECLARACAO', 'PROTOCOLO'],
  'execucoes.status': [
    'NA_FILA',
    'EXECUTANDO',
    'RETRY_AGENDADO',
    'AGUARDANDO_HUMANO',
    'AGUARDANDO_CAPTCHA',
    'AGUARDANDO_AUTENTICACAO',
    'SUCESSO',
    'PARCIAL',
    'FALHA',
    'FONTE_INDISPONIVEL',
    'CANCELADO',
  ],
  'integracoes.tipos': [
    'API_OFICIAL',
    'API_COMERCIAL',
    'PORTAL_AUTOMATIZADO',
    'PORTAL_ASSISTIDO',
    'MANUAL',
  ],
  'integracoes.operacoes': [
    'CERTIDAO_FEDERAL_RFB_PGFN',
    'CERTIDAO_SP_SEFAZ_NAO_INSCRITOS',
    'CERTIDAO_SP_PGE_DIVIDA_ATIVA',
  ],
  'intervencoes.tipos': [
    'CAPTCHA',
    'AUTENTICACAO',
    'MFA',
    'CERTIFICADO',
    'CONFIRMACAO',
    'PORTAL_ALTERADO',
    'OUTRA',
  ],
  'intervencoes.status': ['PENDENTE', 'EM_ATENDIMENTO', 'RESOLVIDA', 'EXPIRADA', 'CANCELADA'],
  'intervencoes.sessao.status': ['AGUARDANDO', 'CONTINUANDO', 'RETOMADA', 'ENCERRADA', 'EXPIRADA'],
  'notificacoes.tipos': ['INFORMACAO', 'AVISO', 'ACAO_NECESSARIA', 'ERRO'],
  'certidoes.tipos': [
    'FEDERAL_RFB_PGFN',
    'SP_SEFAZ_NAO_INSCRITOS',
    'SP_PGE_DIVIDA_ATIVA',
  ],
  'certidoes.status': [
    'NAO_CONSULTADA',
    'AGENDADA',
    'EM_PROCESSAMENTO',
    'REGULAR',
    'POSITIVA_COM_EFEITO_NEGATIVA',
    'IRREGULAR',
    'INCOMPLETA',
    'FONTE_INDISPONIVEL',
    'ACAO_MANUAL_NECESSARIA',
    'PROXIMA_DO_VENCIMENTO',
    'VENCIDA',
    'FALHA',
  ],
  'certidoes.resultados': [
    'REGULAR',
    'POSITIVA_COM_EFEITO_NEGATIVA',
    'IRREGULAR',
    'INCOMPLETA',
    'DESCONHECIDO',
  ],
};

for (const [prefix, values] of Object.entries(catalogs)) {
  for (const value of values) {
    const key = `${prefix}.${value}`;
    if (!hasText(key)) missing.add(key);
  }
}

if (missing.size > 0) {
  console.error('Chaves i18n ausentes ou vazias:');
  for (const key of [...missing].sort()) console.error(`- ${key}`);
  process.exit(1);
}

console.log(
  `Bundle pt-BR válido. ${sourceFiles.length} arquivos e ${Object.values(catalogs).flat().length} entradas dinâmicas verificadas.`,
);
