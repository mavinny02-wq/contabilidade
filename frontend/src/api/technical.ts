export type StatusTecnico = 'SAUDAVEL' | 'DEGRADADO' | 'INDISPONIVEL';

export type ComponenteTecnico = {
  componente: string;
  status: StatusTecnico;
  detalheSeguro?: string;
};

export type WorkerTecnico = {
  workerId: string;
  versao: string;
  statusReportado: string;
  status: StatusTecnico;
  ultimoHeartbeatEm?: string;
  idadeSegundos: number;
  motivoSeguro?: string;
};

export type ResumoTecnico = {
  observadoEm: string;
  banco: ComponenteTecnico;
  storage: ComponenteTecnico;
  worker: ComponenteTecnico;
  workers: WorkerTecnico[];
  workersRegistrados: number;
  workersListaLimitada: boolean;
  workerDegradadoAposSegundos: number;
  workerIndisponivelAposSegundos: number;
  execucoesAbertas: number;
  execucoesComFalha: number;
  intervencoesPendentes: number;
};
