import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './pt-BR.json';
import ptBRAuditoriaExportacao from './pt-BR-auditoria-exportacao.json';
import ptBRCertidoesLote from './pt-BR-certidoes-lote.json';
import ptBRConsoleTecnica from './pt-BR-console-tecnica.json';
import ptBRDashboardCertidoes from './pt-BR-dashboard-certidoes.json';
import ptBRExportacaoCertidoes from './pt-BR-exportacao-certidoes.json';
import ptBRFiliais from './pt-BR-filiais.json';
import ptBRHistoricoEmpresas from './pt-BR-historico-empresas.json';
import ptBRImportacaoEmpresas from './pt-BR-importacao-empresas.json';
import ptBRStorageReconciliacao from './pt-BR-storage-reconciliacao.json';

const translation = {
  ...ptBR,
  auditoria: {
    ...ptBR.auditoria,
    ...ptBRAuditoriaExportacao.auditoria,
    exportacao: {
      ...ptBRAuditoriaExportacao.auditoria.exportacao,
    },
  },
  dashboard: {
    ...ptBR.dashboard,
    ...ptBRDashboardCertidoes.dashboard,
  },
  empresas: {
    ...ptBR.empresas,
    ...ptBRImportacaoEmpresas.empresas,
    filiais: {
      ...ptBR.empresas.filiais,
      ...ptBRFiliais.empresas.filiais,
    },
    importacao: {
      ...ptBRImportacaoEmpresas.empresas.importacao,
    },
    historico: {
      ...ptBRHistoricoEmpresas.empresas.historico,
    },
  },
  certidoes: {
    ...ptBR.certidoes,
    ...ptBRExportacaoCertidoes.certidoes,
    acoes: {
      ...ptBR.certidoes.acoes,
      ...ptBRExportacaoCertidoes.certidoes.acoes,
    },
    mensagens: {
      ...ptBR.certidoes.mensagens,
      ...ptBRExportacaoCertidoes.certidoes.mensagens,
    },
    lote: {
      ...ptBRCertidoesLote.certidoes.lote,
    },
  },
  consoleTecnica: {
    ...ptBR.consoleTecnica,
    ...ptBRConsoleTecnica.consoleTecnica,
    ...ptBRStorageReconciliacao.consoleTecnica,
    storageReconciliacao: {
      ...ptBRStorageReconciliacao.consoleTecnica.storageReconciliacao,
    },
  },
};

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': {
      translation,
    },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
