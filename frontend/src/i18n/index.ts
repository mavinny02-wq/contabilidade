import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './pt-BR.json';
import ptBRAgendaCertidoes from './pt-BR-agenda-certidoes.json';
import ptBRAtualizacaoPreflight from './pt-BR-atualizacao-preflight.json';
import ptBRAuditoriaExportacao from './pt-BR-auditoria-exportacao.json';
import ptBRBackups from './pt-BR-backups.json';
import ptBRCertidoesLote from './pt-BR-certidoes-lote.json';
import ptBRConfiguracaoSegura from './pt-BR-configuracao-segura.json';
import ptBRConsoleTecnica from './pt-BR-console-tecnica.json';
import ptBRDashboardCertidoes from './pt-BR-dashboard-certidoes.json';
import ptBREmpresasClassificacao from './pt-BR-empresas-classificacao.json';
import ptBRExportacaoCertidoes from './pt-BR-exportacao-certidoes.json';
import ptBRFaturasProvedores from './pt-BR-faturas-provedores.json';
import ptBRFiliais from './pt-BR-filiais.json';
import ptBRHistoricoEmpresas from './pt-BR-historico-empresas.json';
import ptBRHistoricoProvedores from './pt-BR-historico-provedores.json';
import ptBRHistoricoWorkers from './pt-BR-historico-workers.json';
import ptBRImportacaoEmpresas from './pt-BR-importacao-empresas.json';
import ptBRMetadadosDocumentos from './pt-BR-metadados-documentos.json';
import ptBRPreviewDocumentos from './pt-BR-preview-documentos.json';
import ptBRResponsaveisModulo from './pt-BR-responsaveis-modulo.json';
import ptBRRetencaoDocumentos from './pt-BR-retencao-documentos.json';
import ptBRStorageReconciliacao from './pt-BR-storage-reconciliacao.json';

const translation = {
  ...ptBR,
  menu: {
    ...ptBR.menu,
    ...ptBRBackups.menu,
    ...ptBRHistoricoProvedores.menu,
    ...ptBRConfiguracaoSegura.menu,
    ...ptBRFaturasProvedores.menu,
    ...ptBRHistoricoWorkers.menu,
    ...ptBRAtualizacaoPreflight.menu,
  },
  auditoria: {
    ...ptBR.auditoria,
    ...ptBRAuditoriaExportacao.auditoria,
    exportacao: {
      ...ptBRAuditoriaExportacao.auditoria.exportacao,
    },
  },
  atualizacaoPreflight: {
    ...ptBRAtualizacaoPreflight.atualizacaoPreflight,
  },
  backups: {
    ...ptBRBackups.backups,
  },
  configuracaoSegura: {
    ...ptBRConfiguracaoSegura.configuracaoSegura,
  },
  faturasProvedores: {
    ...ptBRFaturasProvedores.faturasProvedores,
  },
  responsaveisModulo: {
    ...ptBRResponsaveisModulo.responsaveisModulo,
  },
  historicoProvedores: {
    ...ptBRHistoricoProvedores.historicoProvedores,
  },
  historicoWorkers: {
    ...ptBRHistoricoWorkers.historicoWorkers,
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
    classificacao: {
      ...ptBREmpresasClassificacao.empresas.classificacao,
    },
  },
  documentos: {
    ...ptBR.documentos,
    metadados: {
      ...ptBRMetadadosDocumentos.documentos.metadados,
    },
    preview: {
      ...ptBRPreviewDocumentos.documentos.preview,
    },
    retencao: {
      ...ptBRRetencaoDocumentos.documentos.retencao,
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
    agenda: {
      ...ptBRAgendaCertidoes.certidoes.agenda,
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
