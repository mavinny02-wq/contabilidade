import { unlink } from 'node:fs/promises';
import type { Locator, Page } from 'playwright';
import { config } from './config.js';
import type { ContextoFluxoPortal, FluxoPortal, ResultadoFluxo } from './contracts.js';
import { parseSefazSpCertificate } from './StateCertificatePdfParser.js';
import {
  boundedInteger,
  captchaErrorText,
  captchaPresent,
  captchaSolved,
  captureStatePortalOutcome,
  downloadDocumentAction,
  fillIdentifier,
  findAction,
  findDocumentAction,
  findVisibleInput,
  firstSafeSentence,
  isPdfBytes,
  normalize,
  normalizeIdentifier,
  portalChanged,
  readPdfFromPageBlob,
  requiredString,
  safeError,
  savePdfBytes,
  selectRadioByLabel,
  unavailable,
  unavailableText,
  type DomObserver,
  type StatePortalOutcome,
} from './StateCertificateSupport.js';

const OPERACAO = 'CERTIDAO_SP_SEFAZ_NAO_INSCRITOS';
const PROVEDOR = 'SEFAZ_SP_PORTAL';
const MAX_INTERVENCOES = 2;

type CaptchaResolution =
  | { ok: true; intervencoes: number }
  | { ok: false; code: string; message: string };

export class SefazSpCertificateFlow implements FluxoPortal {
  readonly modo = 'PORTAL' as const;
  readonly operacao = OPERACAO;
  readonly provedorCodigo = PROVEDOR;

  async executar(contexto: ContextoFluxoPortal): Promise<ResultadoFluxo> {
    const cnpj = requiredString(contexto.parametros.cnpj, 'CNPJ_AUSENTE_NO_PAYLOAD')
      .replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return portalChanged('CNPJ_SEFAZ_SP_INVALIDO', 'A consulta SEFAZ-SP exige CNPJ com 14 dígitos.');
    }

    const acompanhamentoId = requiredString(
      contexto.parametros.acompanhamentoId,
      'ACOMPANHAMENTO_AUSENTE_NO_PAYLOAD',
    );
    const empresaId = contexto.empresaId
      ?? requiredString(contexto.parametros.empresaId, 'EMPRESA_AUSENTE_NO_PAYLOAD');
    const permitirIntervencao = Boolean(contexto.parametros.permitirIntervencao);
    const timeoutHumanoMinutos = boundedInteger(
      contexto.parametros.timeoutHumanoMinutos,
      30,
      1,
      120,
    );

    if (config.sefazSpEnforceServiceWindow && !withinSefazSpWindow()) {
      return {
        status: 'FONTE_INDISPONIVEL',
        erroCodigo: 'SEFAZ_SP_FORA_HORARIO',
        erroResumo: 'O sistema eCND da SEFAZ-SP está fora da janela operacional configurada.',
        retryable: true,
      };
    }

    contexto.page.setDefaultTimeout(config.sefazSpNavigationTimeoutMs);
    contexto.page.setDefaultNavigationTimeout(config.sefazSpNavigationTimeoutMs);

    try {
      await contexto.page.goto(config.sefazSpPortalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.sefazSpNavigationTimeoutMs,
      });
      await waitForSefazShell(contexto.page);
    } catch (error) {
      return unavailable('PORTAL_SEFAZ_SP_INDISPONIVEL', error);
    }

    const indisponivel = await detectUnavailable(contexto.page);
    if (indisponivel) {
      return {
        status: 'FONTE_INDISPONIVEL',
        erroCodigo: 'PORTAL_SEFAZ_SP_INDISPONIVEL',
        erroResumo: indisponivel,
        retryable: true,
      };
    }

    await selectRadioByLabel(contexto.page, /^CNPJ$/i, ['cnpj', 'pj', '2']);
    const input = await findSefazCnpjInput(contexto.page);
    if (!input) {
      return portalChanged(
        'CAMPO_CNPJ_SEFAZ_SP_NAO_ENCONTRADO',
        'O sistema eCND não apresentou um campo identificável para o CNPJ.',
      );
    }
    await fillIdentifier(input, cnpj);

    const captchaInicial = await resolveCaptcha(
      contexto,
      permitirIntervencao,
      timeoutHumanoMinutos,
      0,
    );
    if (!captchaInicial.ok) {
      return portalChanged(captchaInicial.code, captchaInicial.message);
    }
    let intervencoes = captchaInicial.intervencoes;

    const submit = await findAction(
      contexto.page,
      /emitir(?:\s+e?cnd|\s+certid[aã]o)?|consultar|gerar/i,
    );
    if (!submit) {
      return portalChanged(
        'BOTAO_EMITIR_SEFAZ_SP_NAO_ENCONTRADO',
        'O sistema eCND não apresentou um comando identificável para emitir a certidão.',
      );
    }

    let outcome = await clickAndCapture(contexto.page, contexto.execucaoId, submit);
    if (outcome.kind === 'captcha') {
      const novaValidacao = await resolveCaptcha(
        contexto,
        permitirIntervencao,
        timeoutHumanoMinutos,
        intervencoes,
      );
      if (!novaValidacao.ok) {
        return portalChanged(novaValidacao.code, novaValidacao.message);
      }
      intervencoes = novaValidacao.intervencoes;
      const retry = await findAction(
        contexto.page,
        /emitir(?:\s+e?cnd|\s+certid[aã]o)?|consultar|gerar/i,
      );
      if (!retry) {
        return portalChanged(
          'BOTAO_EMITIR_SEFAZ_SP_NAO_ENCONTRADO_APOS_CAPTCHA',
          'O comando de emissão desapareceu após a validação humana.',
        );
      }
      outcome = await clickAndCapture(contexto.page, contexto.execucaoId, retry);
    }

    const terminal = terminalResult(outcome);
    if (terminal) return terminal;
    if (outcome.kind !== 'pdf') {
      return portalChanged('PORTAL_SEFAZ_SP_RESULTADO_INVALIDO', 'O sistema eCND retornou um resultado interno não reconhecido.');
    }

    const pdfPath = outcome.filePath;
    try {
      const parsed = await parseSefazSpCertificate(pdfPath);
      if (parsed.cnpj && normalizeIdentifier(parsed.cnpj) !== cnpj) {
        return portalChanged(
          'DOCUMENTO_SEFAZ_SP_CNPJ_DIVERGENTE',
          'O CNPJ extraído do documento não corresponde ao estabelecimento consultado.',
        );
      }

      const upload = await contexto.documentos.enviar({
        empresaId,
        tipo: 'CERTIDAO',
        origem: intervencoes > 0 ? 'PORTAL_ASSISTIDO' : 'PORTAL_AUTOMATIZADO',
        arquivoPath: pdfPath,
        mimeType: 'application/pdf',
        nomeArquivo: `certidao-sefaz-sp-nao-inscritos-${cnpj}.pdf`,
        emitidoEm: parsed.issuedAt,
        validoAte: parsed.validUntil,
      });

      return {
        status: 'SUCESSO',
        protocoloExterno: parsed.number,
        dados: {
          acompanhamentoId,
          resultado: parsed.result,
          numeroCertidao: parsed.number,
          emitidaEm: parsed.issuedAt,
          validaAte: parsed.validUntil,
          documentoId: upload.id,
          mensagemFonte: parsed.sourceMessage,
        },
        custo: 0,
        moeda: 'BRL',
      };
    } catch (error) {
      return {
        status: 'FALHA',
        erroCodigo: 'PDF_SEFAZ_SP_NAO_PROCESSADO',
        erroResumo: safeError(error),
        retryable: false,
      };
    } finally {
      await unlink(pdfPath).catch(() => undefined);
    }
  }
}

async function clickAndCapture(
  page: Page,
  executionId: string,
  action: Locator,
): Promise<StatePortalOutcome> {
  return captureStatePortalOutcome(page, {
    executionId,
    resultTimeoutMs: config.sefazSpResultTimeoutMs,
    downloadDirectory: config.downloadDirectory,
    observe: createSefazObserver(executionId),
    trigger: () => action.click(),
    triggerErrorPrefix: 'Não foi possível acionar a emissão',
  });
}

function createSefazObserver(executionId: string): DomObserver {
  return async (page, rawText, text, state) => {
    if (unavailableText(text) || outsideHoursText(text)) {
      return {
        kind: 'unavailable',
        message: firstSafeSentence(rawText) || 'O sistema eCND da SEFAZ-SP está indisponível.',
      };
    }
    if (await captchaPresent(page) && captchaErrorText(text)) {
      return { kind: 'captcha' };
    }
    if (blockedByPendingDebt(text)) {
      return {
        kind: 'business-blocked',
        code: 'CERTIDAO_SEFAZ_SP_NAO_EMITIDA',
        message: firstSafeSentence(rawText)
          || 'A certidão não pôde ser emitida eletronicamente. Consulte as pendências e utilize o fluxo administrativo aplicável.',
      };
    }

    if (!state.documentActionClicked) {
      const documentAction = await findDocumentAction(page);
      if (documentAction) {
        const direct = await downloadDocumentAction(page, documentAction, {
          executionId,
          downloadDirectory: config.downloadDirectory,
        });
        if (direct) return { kind: 'pdf', filePath: direct };
        state.documentActionClicked = true;
        await documentAction.click().catch(() => undefined);
      }
    }

    if (text.includes('CERTIDAO NEGATIVA DE DEBITOS TRIBUTARIOS NAO INSCRITOS')) {
      const blob = await readPdfFromPageBlob(page).catch(() => undefined);
      if (blob && isPdfBytes(blob)) {
        const path = await savePdfBytes(executionId, config.downloadDirectory, blob);
        return { kind: 'pdf', filePath: path };
      }
      if (state.documentActionClicked) {
        return {
          kind: 'portal-changed',
          message: 'O sistema eCND exibiu a certidão, mas não disponibilizou os bytes do PDF oficial.',
        };
      }
    }
    return undefined;
  };
}

async function findSefazCnpjInput(page: Page): Promise<Locator | undefined> {
  return findVisibleInput(page, {
    direct: [
      page.getByRole('textbox', { name: /CNPJ/i }),
      page.getByLabel(/CNPJ/i),
      page.locator('input[name*="cnpj" i]'),
      page.locator('input[id*="cnpj" i]'),
      page.locator('input[name*="cgc" i]'),
      page.locator('input[id*="cgc" i]'),
      page.locator('input[maxlength="14"]'),
      page.locator('input[maxlength="18"]'),
    ],
    keywords: ['CNPJ', 'CGC'],
    preferredMaxLengths: [14, 18],
  });
}

async function waitForSefazShell(page: Page): Promise<void> {
  const deadline = Date.now() + config.sefazSpNavigationTimeoutMs;
  while (Date.now() < deadline) {
    const text = normalize(await page.locator('body').innerText().catch(() => ''));
    if (
      text.includes('CERTIDAO NEGATIVA DE DEBITOS TRIBUTARIOS NAO INSCRITOS')
      || text.includes('EMISSAO DA CERTIDAO NEGATIVA DE DEBITOS')
      || (text.includes('CNPJ') && text.includes('CPF'))
    ) return;
    await page.waitForTimeout(400);
  }
  throw new Error('A estrutura principal do sistema eCND não foi apresentada.');
}

async function detectUnavailable(page: Page): Promise<string | undefined> {
  const raw = await page.locator('body').innerText().catch(() => '');
  const text = normalize(raw);
  return unavailableText(text) || outsideHoursText(text)
    ? firstSafeSentence(raw) || 'O sistema eCND da SEFAZ-SP está indisponível.'
    : undefined;
}

async function resolveCaptcha(
  contexto: ContextoFluxoPortal,
  permitirIntervencao: boolean,
  timeoutHumanoMinutos: number,
  current: number,
): Promise<CaptchaResolution> {
  let intervencoes = current;
  while (await captchaPresent(contexto.page)) {
    if (await captchaSolved(contexto.page)) break;
    if (!permitirIntervencao) {
      return {
        ok: false,
        code: 'CAPTCHA_SEFAZ_SP_REQUER_INTERVENCAO',
        message: 'A SEFAZ-SP exige validação humana e a política não permite intervenção.',
      };
    }
    if (intervencoes >= MAX_INTERVENCOES) {
      return {
        ok: false,
        code: 'CAPTCHA_SEFAZ_SP_NAO_CONCLUIDO',
        message: 'A validação humana da SEFAZ-SP não foi concluída após duas intervenções.',
      };
    }
    intervencoes += 1;
    await contexto.intervencao.aguardar({
      tipo: 'CAPTCHA',
      codigo: 'CAPTCHA_SEFAZ_SP_NECESSARIO',
      resumo: 'O sistema eCND da SEFAZ-SP solicitou validação humana.',
      tituloKey: 'certidoes.intervencaoSefazSpCaptcha.titulo',
      instrucaoKey: intervencoes === 1
        ? 'certidoes.intervencaoSefazSpCaptcha.instrucao'
        : 'certidoes.intervencaoSefazSpCaptcha.instrucaoNovaTentativa',
      timeoutMinutos: timeoutHumanoMinutos,
    });
    await contexto.page.waitForTimeout(800);
  }
  return { ok: true, intervencoes };
}

function terminalResult(outcome: StatePortalOutcome): ResultadoFluxo | undefined {
  if (outcome.kind === 'pdf') return undefined;
  if (outcome.kind === 'business-blocked') {
    return {
      status: 'FALHA',
      erroCodigo: outcome.code,
      erroResumo: outcome.message,
      retryable: false,
    };
  }
  if (outcome.kind === 'unavailable') {
    return {
      status: 'FONTE_INDISPONIVEL',
      erroCodigo: 'PORTAL_SEFAZ_SP_INDISPONIVEL',
      erroResumo: outcome.message,
      retryable: true,
    };
  }
  if (outcome.kind === 'portal-changed') {
    return portalChanged('PORTAL_SEFAZ_SP_ALTERADO', outcome.message);
  }
  if (outcome.kind === 'timeout') {
    return {
      status: 'FALHA',
      erroCodigo: 'TIMEOUT_RESULTADO_SEFAZ_SP',
      erroResumo: 'O sistema eCND não apresentou PDF nem resultado conclusivo no tempo esperado.',
      retryable: true,
    };
  }
  return portalChanged(
    'CAPTCHA_SEFAZ_SP_NAO_CONCLUIDO',
    'O sistema eCND continuou solicitando validação humana.',
  );
}

function blockedByPendingDebt(text: string): boolean {
  return [
    'NAO FOI POSSIVEL EMITIR A CERTIDAO',
    'NAO FOI POSSIVEL GERAR A CERTIDAO',
    'CERTIDAO NAO PODE SER EMITIDA',
    'CERTIDAO NAO SERA EMITIDA ELETRONICAMENTE',
    'EXISTEM IMPEDIMENTOS',
    'PENDENCIAS FISCAIS',
    'RELATORIO DE PENDENCIAS',
    'IMPOSSIBILIDADE DE GERACAO ELETRONICA',
  ].some((marker) => text.includes(marker));
}

function outsideHoursText(text: string): boolean {
  return text.includes('SISTEMA DISPONIVEL EM DIAS UTEIS DAS 06:00 AS 21:00')
    && (text.includes('ACESSO NEGADO') || text.includes('FORA DO HORARIO'));
}

function withinSefazSpWindow(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? -1);
  return Boolean(weekday && !['Sat', 'Sun'].includes(weekday) && hour >= 6 && hour < 21);
}
