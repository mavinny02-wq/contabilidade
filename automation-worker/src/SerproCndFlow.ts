import { config } from './config.js';
import type {
  ContextoFluxoApi,
  DiagnosticoFluxo,
  FluxoApi,
  ResultadoFluxo,
} from './contracts.js';
import {
  SerproConfigurationError,
  SerproTokenError,
  SerproTokenProvider,
} from './SerproTokenProvider.js';

const OPERACAO = 'CERTIDAO_FEDERAL_RFB_PGFN';
const PROVEDOR = 'SERPRO';

type SerproResponse = {
  Status?: unknown;
  Mensagem?: unknown;
  Chave?: unknown;
  Certidao?: {
    TipoContribuinte?: unknown;
    ContribuinteCertidao?: unknown;
    TipoCertidao?: unknown;
    CodigoControle?: unknown;
    DataEmissao?: unknown;
    DataValidade?: unknown;
    DocumentoPdf?: unknown;
  };
};

type SerproCallResult = {
  httpStatus: number;
  body: SerproResponse;
};

export class SerproCndFlow implements FluxoApi {
  readonly modo = 'API' as const;
  readonly operacao = OPERACAO;
  readonly provedorCodigo = PROVEDOR;

  constructor(private readonly tokens = new SerproTokenProvider()) {}

  diagnostico(): DiagnosticoFluxo {
    return {
      configurado: this.tokens.configurado(),
      modoAutenticacao: this.tokens.modoAutenticacao(),
      destino: hostSeguro(config.serpro.apiUrl),
      detalheSeguro: this.tokens.configurado()
        ? 'Credenciais disponíveis no ambiente do worker.'
        : 'Defina Consumer Key/Secret ou um bearer token controlado.',
    };
  }

  async executar(contexto: ContextoFluxoApi): Promise<ResultadoFluxo> {
    let empresaId: string;
    let acompanhamentoId: string;
    let cnpj: string;
    try {
      empresaId = contexto.empresaId
        ?? textoObrigatorio(contexto.parametros.empresaId, 'EMPRESA_AUSENTE_NO_PAYLOAD');
      acompanhamentoId = textoObrigatorio(
        contexto.parametros.acompanhamentoId,
        'ACOMPANHAMENTO_AUSENTE_NO_PAYLOAD',
      );
      cnpj = normalizarCnpj(
        textoObrigatorio(contexto.parametros.cnpj, 'CNPJ_AUSENTE_NO_PAYLOAD'),
      );
    } catch (error) {
      return falha('SERPRO_PAYLOAD_INVALIDO', resumoSeguro(error), false);
    }

    const custoPorChamada = numeroNaoNegativo(
      contexto.parametros.provedorCustoEstimadoPorChamada,
    );
    const moeda = textoOpcional(contexto.parametros.provedorMoeda)?.toUpperCase()
      || 'BRL';
    const processingTimeoutMs = timeoutProcessamento(
      contexto.parametros.provedorTimeoutSegundos,
      config.serpro.processingTimeoutMs,
    );

    if (!this.tokens.configurado()) {
      return falha(
        'SERPRO_CREDENCIAIS_NAO_CONFIGURADAS',
        'O provider SERPRO está habilitado, mas as credenciais não foram configuradas no worker.',
        false,
      );
    }

    const deadline = Date.now() + processingTimeoutMs;
    let chave: string | undefined;
    let chamadasBilhetaveis = 0;
    const comCusto = (resultado: ResultadoFluxo): ResultadoFluxo =>
      adicionarCusto(
        resultado,
        chamadasBilhetaveis,
        custoPorChamada,
        moeda,
      );

    try {
      while (true) {
        if (Date.now() >= deadline) {
          return comCusto(falha(
            'SERPRO_PROCESSAMENTO_TIMEOUT',
            'A Consulta CND permaneceu em processamento além do limite configurado.',
            true,
          ));
        }

        const response = await this.consultar(cnpj, chave);
        if (response.httpStatus === 200 || response.httpStatus === 201) {
          chamadasBilhetaveis++;
        }

        const status = inteiro(response.body.Status);
        const mensagem = textoOpcional(response.body.Mensagem);

        if (status === 7) {
          chave = textoOpcional(response.body.Chave);
          if (!chave) {
            return comCusto(falha(
              'SERPRO_CHAVE_PROCESSAMENTO_AUSENTE',
              'A API informou processamento pendente sem retornar a chave de continuação.',
              true,
            ));
          }
          await esperar(config.serpro.pollIntervalMs);
          continue;
        }

        if (status === 1 || status === 2) {
          return adicionarCusto(
            await this.concluirCertidao({
              contexto,
              empresaId,
              acompanhamentoId,
              cnpj,
              response: response.body,
              mensagem,
              chamadasBilhetaveis,
              custoPorChamada,
              moeda,
            }),
            chamadasBilhetaveis,
            custoPorChamada,
            moeda,
          );
        }

        if (status === 3 || status === 4 || status === 8) {
          return sucessoIncompleto({
            acompanhamentoId,
            mensagem: mensagem || mensagemStatus(status),
            protocolo: undefined,
            chamadasBilhetaveis,
            custoPorChamada,
            moeda,
            statusSerpro: status,
          });
        }

        if (status === 5) {
          return comCusto(falha(
            'SERPRO_ANALISE_INCONSISTENTE',
            mensagem || 'A análise da API foi interrompida por atualização de base.',
            true,
          ));
        }

        if (status === 6) {
          return comCusto(indisponivel(
            'SERPRO_BASE_APOIO_INDISPONIVEL',
            mensagem || 'Uma base necessária à Consulta CND está indisponível.',
          ));
        }

        if (status === 14) {
          // A chave é efêmera e não é persistida. Uma nova tentativa recomeça sem ela.
          return comCusto(falha(
            'SERPRO_CHAVE_NAO_ENCONTRADA',
            mensagem || 'A chave de processamento não foi encontrada.',
            true,
          ));
        }

        if ([9, 10, 11, 12, 13, 15].includes(status ?? -1)) {
          return comCusto(falha(
            `SERPRO_REQUISICAO_INVALIDA_${status}`,
            mensagem || 'A API rejeitou os parâmetros da Consulta CND.',
            false,
          ));
        }

        if (status === 99 || response.httpStatus >= 500) {
          return comCusto(indisponivel(
            'SERPRO_ERRO_SERVIDOR',
            mensagem || `A API Consulta CND retornou HTTP ${response.httpStatus}.`,
          ));
        }

        if (response.httpStatus === 429 || response.httpStatus === 504) {
          return comCusto(indisponivel(
            'SERPRO_TEMPORARIAMENTE_INDISPONIVEL',
            `A API Consulta CND retornou HTTP ${response.httpStatus}.`,
          ));
        }

        return comCusto(falha(
          'SERPRO_RESPOSTA_NAO_RECONHECIDA',
          `Resposta não reconhecida da Consulta CND: HTTP ${response.httpStatus}, status ${status ?? 'ausente'}.`,
          response.httpStatus >= 500,
        ));
      }
    } catch (error) {
      if (error instanceof SerproConfigurationError) {
        return comCusto(
          falha(error.code, 'Credenciais Serpro não configuradas.', false),
        );
      }
      if (error instanceof SerproTokenError) {
        return comCusto(
          error.retryable
            ? indisponivel(error.code, error.safeDetail)
            : falha(error.code, error.safeDetail, false),
        );
      }
      if (error instanceof SerproHttpError) {
        if (error.billable) chamadasBilhetaveis++;
        return comCusto(
          error.sourceUnavailable
            ? indisponivel(error.code, error.safeDetail)
            : falha(error.code, error.safeDetail, error.retryable),
        );
      }
      return comCusto(
        indisponivel('SERPRO_FALHA_COMUNICACAO', resumoSeguro(error)),
      );
    }
  }

  private async consultar(cnpj: string, chave?: string): Promise<SerproCallResult> {
    return await this.consultarComToken(cnpj, chave, false);
  }

  private async consultarComToken(
    cnpj: string,
    chave: string | undefined,
    tokenRenovado: boolean,
  ): Promise<SerproCallResult> {
    const token = await this.tokens.obter(tokenRenovado);
    const body: Record<string, unknown> = {
      TipoContribuinte: 1,
      ContribuinteConsulta: cnpj,
      CodigoIdentificacao: '9001',
      GerarCertidaoPdf: true,
    };
    if (chave) body.Chave = chave;

    let response: Response;
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      if (config.serpro.requestTag) {
        headers['X-Request-Tag'] = config.serpro.requestTag;
      }
      response = await fetch(config.serpro.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.serpro.httpTimeoutMs),
      });
    } catch (error) {
      throw new SerproHttpError(
        'SERPRO_API_INALCANCAVEL',
        resumoSeguro(error),
        true,
        true,
      );
    }

    if (response.status === 401 && !tokenRenovado) {
      this.tokens.invalidar();
      return await this.consultarComToken(cnpj, chave, true);
    }
    if (response.status === 401 || response.status === 403) {
      throw new SerproHttpError(
        'SERPRO_AUTORIZACAO_REJEITADA',
        `HTTP ${response.status}`,
        false,
        false,
      );
    }

    let parsed: SerproResponse | undefined;
    try {
      parsed = await parseJsonSeguro(response);
    } catch (error) {
      const sourceUnavailable = response.status >= 500
        || response.status === 429
        || response.status === 408;
      throw new SerproHttpError(
        'SERPRO_RESPOSTA_NAO_LIDA',
        `HTTP ${response.status}: ${resumoSeguro(error)}`,
        true,
        sourceUnavailable,
        response.status === 200 || response.status === 201,
      );
    }
    if (!parsed) {
      const sourceUnavailable = response.status >= 500
        || response.status === 429
        || response.status === 408;
      throw new SerproHttpError(
        'SERPRO_RESPOSTA_NAO_JSON',
        `HTTP ${response.status} sem objeto JSON válido.`,
        sourceUnavailable,
        sourceUnavailable,
        response.status === 200 || response.status === 201,
      );
    }
    return {
      httpStatus: response.status,
      body: parsed,
    };
  }

  private async concluirCertidao(input: {
    contexto: ContextoFluxoApi;
    empresaId: string;
    acompanhamentoId: string;
    cnpj: string;
    response: SerproResponse;
    mensagem?: string;
    chamadasBilhetaveis: number;
    custoPorChamada?: number;
    moeda: string;
  }): Promise<ResultadoFluxo> {
    const certidao = input.response.Certidao;
    if (!certidao || typeof certidao !== 'object') {
      return falha(
        'SERPRO_CERTIDAO_AUSENTE',
        'A API informou sucesso, mas não retornou o objeto Certidao.',
        true,
      );
    }

    const contribuinteRaw = textoOpcional(certidao.ContribuinteCertidao);
    if (!contribuinteRaw) {
      return falha(
        'SERPRO_CNPJ_CERTIDAO_AUSENTE',
        'A resposta não informou o CNPJ da certidão.',
        false,
      );
    }
    let contribuinte: string;
    try {
      contribuinte = normalizarCnpj(contribuinteRaw);
    } catch {
      return falha(
        'SERPRO_CNPJ_CERTIDAO_INVALIDO',
        'O CNPJ retornado no objeto Certidao é inválido.',
        false,
      );
    }
    if (contribuinte.slice(0, 8) !== input.cnpj.slice(0, 8)) {
      return falha(
        'SERPRO_CNPJ_CERTIDAO_DIVERGENTE',
        'O CNPJ retornado não pertence à mesma pessoa jurídica consultada.',
        false,
      );
    }

    const tipoCertidao = inteiro(certidao.TipoCertidao);
    const resultado = tipoCertidao === 1
      ? 'REGULAR'
      : tipoCertidao === 2
        ? 'POSITIVA_COM_EFEITO_NEGATIVA'
        : undefined;
    if (!resultado) {
      return falha(
        'SERPRO_TIPO_CERTIDAO_INVALIDO',
        'A API retornou um tipo de certidão não reconhecido.',
        false,
      );
    }

    const emitidaEm = dataIso(certidao.DataEmissao);
    const validaAte = dataIso(certidao.DataValidade);
    if (!emitidaEm || !validaAte || validaAte < emitidaEm) {
      return falha(
        'SERPRO_DATAS_CERTIDAO_INVALIDAS',
        'A API retornou datas de emissão ou validade inválidas.',
        false,
      );
    }

    let pdf: Uint8Array;
    try {
      pdf = decodePdf(certidao.DocumentoPdf);
    } catch (error) {
      return falha(
        'SERPRO_PDF_INVALIDO',
        resumoSeguro(error),
        false,
      );
    }

    const codigoControle = textoOpcional(certidao.CodigoControle);
    let documento: { id: string };
    try {
      documento = await input.contexto.documentos.enviarBytes({
        empresaId: input.empresaId,
        tipo: 'CERTIDAO',
        origem: 'API_OFICIAL',
        bytes: pdf,
        mimeType: 'application/pdf',
        nomeArquivo: `certidao-federal-rfb-pgfn-${contribuinte}.pdf`,
        emitidoEm: emitidaEm,
        validoAte: validaAte,
      });
    } catch (error) {
      return falha(
        'SERPRO_DOCUMENTO_NAO_ARMAZENADO',
        `A certidão foi retornada, mas não pôde ser armazenada: ${resumoSeguro(error)}`,
        true,
      );
    }

    const custo = custoTotal(
      input.chamadasBilhetaveis,
      input.custoPorChamada,
    );
    return {
      status: 'SUCESSO',
      protocoloExterno: codigoControle,
      dados: {
        acompanhamentoId: input.acompanhamentoId,
        resultado,
        numeroCertidao: codigoControle,
        emitidaEm,
        validaAte,
        documentoId: documento.id,
        mensagemFonte: input.mensagem,
        statusSerpro: inteiro(input.response.Status),
        chamadasBilhetaveis: input.chamadasBilhetaveis,
      },
      ...(custo === undefined ? {} : { custo, moeda: input.moeda }),
    };
  }
}

class SerproHttpError extends Error {
  constructor(
    readonly code: string,
    readonly safeDetail: string,
    readonly retryable: boolean,
    readonly sourceUnavailable: boolean,
    readonly billable = false,
  ) {
    super(`${code}: ${safeDetail}`);
    this.name = 'SerproHttpError';
  }
}

async function parseJsonSeguro(response: Response): Promise<SerproResponse | undefined> {
  const text = await response.text();
  if (!text.trim()) return undefined;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as SerproResponse
      : undefined;
  } catch {
    return undefined;
  }
}

function sucessoIncompleto(input: {
  acompanhamentoId: string;
  mensagem: string;
  protocolo?: string;
  chamadasBilhetaveis: number;
  custoPorChamada?: number;
  moeda: string;
  statusSerpro: number;
}): ResultadoFluxo {
  const custo = custoTotal(input.chamadasBilhetaveis, input.custoPorChamada);
  return {
    status: 'SUCESSO',
    protocoloExterno: input.protocolo,
    dados: {
      acompanhamentoId: input.acompanhamentoId,
      resultado: 'INCOMPLETA',
      mensagemFonte: input.mensagem,
      statusSerpro: input.statusSerpro,
      chamadasBilhetaveis: input.chamadasBilhetaveis,
    },
    ...(custo === undefined ? {} : { custo, moeda: input.moeda }),
  };
}

function falha(
  erroCodigo: string,
  erroResumo: string,
  retryable: boolean,
): ResultadoFluxo {
  return {
    status: 'FALHA',
    erroCodigo,
    erroResumo: erroResumo.slice(0, 500),
    retryable,
  };
}

function indisponivel(erroCodigo: string, erroResumo: string): ResultadoFluxo {
  return {
    status: 'FONTE_INDISPONIVEL',
    erroCodigo,
    erroResumo: erroResumo.slice(0, 500),
    retryable: true,
  };
}

function textoObrigatorio(value: unknown, code: string): string {
  const text = textoOpcional(value);
  if (!text) throw new Error(code);
  return text;
}

function textoOpcional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined;
}

function inteiro(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isInteger(number) ? number : undefined;
}

function numeroNaoNegativo(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function timeoutProcessamento(value: unknown, fallbackMs: number): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallbackMs;
  return Math.min(Math.max(Math.trunc(seconds * 1_000), 5_000), 600_000);
}

function normalizarCnpj(value: string): string {
  const cnpj = value.replace(/\D/g, '');
  if (cnpj.length !== 14) {
    throw new Error('CNPJ_INVALIDO_PARA_CONSULTA_SERPRO');
  }
  return cnpj;
}

function dataIso(value: unknown): string | undefined {
  const text = textoOpcional(value);
  if (!text) return undefined;
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
  if (!match?.[1]) return undefined;
  const date = new Date(`${match[1]}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]
    ? undefined
    : match[1];
}

function decodePdf(value: unknown): Uint8Array {
  const raw = textoOpcional(value);
  if (!raw) throw new Error('A API não retornou DocumentoPdf.');
  const clean = raw.replace(/^data:application\/pdf;base64,/i, '').replace(/\s/g, '');
  if (
    clean.length < 8
    || clean.length % 4 !== 0
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)
  ) {
    throw new Error('O conteúdo base64 do PDF é inválido.');
  }
  const estimatedBytes = Math.floor(clean.length * 0.75);
  if (estimatedBytes > config.serpro.maxPdfBytes) {
    throw new Error('O PDF retornado excede o tamanho máximo configurado.');
  }
  const buffer = Buffer.from(clean, 'base64');
  if (
    buffer.length < 5
    || buffer.length > config.serpro.maxPdfBytes
    || buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
  ) {
    throw new Error('O documento retornado não possui assinatura PDF válida.');
  }
  return new Uint8Array(buffer);
}

function adicionarCusto(
  resultado: ResultadoFluxo,
  chamadas: number,
  custoPorChamada: number | undefined,
  moeda: string,
): ResultadoFluxo {
  const custo = custoTotal(chamadas, custoPorChamada);
  if (custo === undefined || resultado.status === 'AGUARDANDO_HUMANO') {
    return resultado;
  }
  return { ...resultado, custo, moeda };
}

function custoTotal(chamadas: number, custoPorChamada?: number): number | undefined {
  if (custoPorChamada === undefined) return undefined;
  return Number((chamadas * custoPorChamada).toFixed(4));
}

function mensagemStatus(status: number): string {
  switch (status) {
    case 3:
      return 'A certidão não pôde ser emitida. Consulte a Situação Fiscal no e-CAC.';
    case 4:
      return 'A certidão não pôde ser emitida por situação cadastral impeditiva.';
    case 8:
      return 'O CNPJ não foi localizado no sistema de certidões.';
    default:
      return 'A Consulta CND não retornou uma certidão.';
  }
}

function hostSeguro(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return 'URL inválida';
  }
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resumoSeguro(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return 'Timeout na comunicação com o Serpro.';
    return `${error.name}: ${error.message}`.slice(0, 500);
  }
  return String(error).slice(0, 500);
}
