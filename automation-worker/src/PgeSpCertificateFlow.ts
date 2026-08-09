import { unlink } from 'node:fs/promises';
import type { Locator, Page } from 'playwright';
import { config } from './config.js';
import type { ContextoFluxoPortal, FluxoPortal, ResultadoFluxo } from './contracts.js';
import { parsePgeSpCertificate } from './StateCertificatePdfParser.js';
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

const OPERACAO = 'CERTIDAO_SP_PGE_DIVIDA_ATIVA';
const PROVEDOR = 'PGE_SP_PORTAL';
const MAX_INTERVENCOES = 2;

type CaptchaResolution =
  | { ok: true; intervencoes: number }
  | { ok: false; code: string; message: string };

export class PgeSpCertificateFlow implements FluxoPortal {
  readonly modo = 'PORTAL' as const;
  readonly operacao = OPERACAO;
  readonly provedorCodigo = PROVEDOR;

  async executar(contexto: ContextoFluxoPortal): Promise<ResultadoFluxo> {
    const cnpj = requiredString(contexto.parametros.cnpj, 'CNPJ_AUSENTE_NO_PAYLOAD')
      .replace(/\D/g, '');
    if (cnpj.length !== 14) {
      return portalChanged('CNPJ_PGE_SP_INVALIDO', 'A consulta PGE-SP exige CNPJ com 14 dígitos.');
    }
    const cnpjBase = cnpj.slice(0, 8);
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

    contexto.page.setDefaultTimeout(config.pgeSpNavigationTimeoutMs);
    contexto.page.setDefaultNavigationTimeout(config.pgeSpNavigationTimeoutMs);

    try {
      await contexto.page.goto(config.pgeSpPortalUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.pgeSpNavigationTimeoutMs,
      });
      await waitForPgeShell(contexto.page);
    } catch (error) {
      return unavailable('PORTAL_PGE_SP_INDISPONIVEL', error);
    }

    const indisponivel = await detectUnavailable(contexto.page);
    if (indisponivel) {
      return {
        status: 'FONTE_INDISPONIVEL',
        erroCodigo: 'PORTAL_PGE_SP_INDISPONIVEL',
        erroResumo: indisponivel,
        retryable: true,
      };
    }

    await selectRadioByLabel(
      contexto.page,
      /CNPJ|PESSOA\s+JUR[IÍ]DICA/i,
      ['cnpj', 'pj', 'juridica', '2'],
    );
    const input = await findPgeCnpjInput(contexto.page);
    if (!input) {
      return portalChanged(
        'CAMPO_CNPJ_BASE_PGE_SP_NAO_ENCONTRADO',
        'O portal da PGE-SP não apresentou um campo identificável para o CNPJ base.',
      );
    }
    await fillIdentifier(input, cnpjBase);

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
      /emitir\s+e?-?crda|emitir\s+certid[aã]o(?:\s+negativa)?|consultar|gerar/i,
    );
    if (!submit) {
      return portalChanged(
        'BOTAO_EMITIR_PGE_SP_NAO_ENCONTRADO',
        'O portal da PGE-SP não apresentou um comando identificável para emitir a e-CRDA.',
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
        /emitir\s+e?-?crda|emitir\s+certid[aã]o(?:\s+negativa)?|consultar|gerar/i,
      );
      if (!retry) {
        return portalChanged(
          'BOTAO_EMITIR_PGE_SP_NAO_ENCONTRADO_APOS_CAPTCHA',
          'O comando de emissão da e-CRDA desapareceu após a validação humana.',
        );
      }
      outcome = await clickAndCapture(contexto.page, contexto.execucaoId, retry);
    }

    const terminal = terminalResult(outcome);
    if (terminal) return terminal;
    if (outcome.kind !== 'pdf') {
      return portalChanged('PORTAL_PGE_SP_RESULTADO_INVALIDO', 'O portal da PGE-SP retornou um resultado interno não reconhecido.');
    }

    const pdfPath = outcome.filePath;
    try {
      const parsed = await parsePgeSpCertificate(pdfPath);
      if (parsed.cnpj && normalizeIdentifier(parsed.cnpj).slice(0, 8) !== cnpjBase) {
        return portalChanged(
          'DOCUMENTO_PGE_SP_CNPJ_BASE_DIVERGENTE',
          'O CNPJ base extraído do documento não corresponde à empresa consultada.',
        );
      }

      const upload = await contexto.documentos.enviar({
        empresaId,
        tipo: 'CERTIDAO',
        origem: intervencoes > 0 ? 'PORTAL_ASSISTIDO' : 'PORTAL_AUTOMATIZADO',
        arquivoPath: pdfPath,
        mimeType: 'application/pdf',
        nomeArquivo: `certidao-pge-sp-divida-ativa-${cnpjBase}.pdf`,
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
        erroCodigo: 'PDF_PGE_SP_NAO_PROCESSADO',
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
    resultTimeoutMs: config.pgeSpResultTimeoutMs,
    downloadDirectory: config.downloadDirectory,
    observe: createPgeObserver(executionId),
    trigger: () => action.click(),
    triggerErrorPrefix: 'Não foi possível acionar a emissão da e-CRDA',
  });
}

function createPgeObserver(executionId: string): DomObserver {
  return async (page, rawText, text, state) => {
    if (unavailableText(text)) {
      return {
        kind: 'unavailable',
        message: firstSafeSentence(rawText) || 'O portal da PGE-SP está indisponível.',
      };
    }
    if (await captchaPresent(page) && captchaErrorText(text)) {
      return { kind: 'captcha' };
    }
    if (negativeCertificateBlocked(text)) {
      return {
        kind: 'business-blocked',
        code: 'CERTIDAO_NEGATIVA_PGE_SP_NAO_EMITIDA',
        message: firstSafeSentence(rawText)
          || 'A certidão negativa não pôde ser emitida. O caso deve seguir o procedimento aplicável da PGE-SP.',
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

    if (
      text.includes('CERTIDAO DE REGULARIDADE FISCAL')
      || text.includes('CERTIDAO NEGATIVA DE DEBITOS INSCRITOS')
      || text.includes('E-CRDA')
    ) {
      const blob = await readPdfFromPageBlob(page).catch(() => undefined);
      if (blob && isPdfBytes(blob)) {
        const path = await savePdfBytes(executionId, config.downloadDirectory, blob);
        return { kind: 'pdf', filePath: path };
      }
      if (state.documentActionClicked) {
        return {
          kind: 'portal-changed',
          message: 'O portal da PGE-SP exibiu a certidão, mas não disponibilizou os bytes do PDF oficial.',
        };
      }
    }
    return undefined;
  };
}

async function findPgeCnpjInput(page: Page): Promise<Locator | undefined> {
  return findVisibleInput(page, {
    direct: [
      page.getByRole('textbox', { name: /CNPJ\s*BASE|CNPJ/i }),
      page.getByLabel(/CNPJ\s*BASE|CNPJ/i),
      page.locator('input[name*="cnpj" i]'),
      page.locator('input[id*="cnpj" i]'),
      page.locator('input[name*="cgc" i]'),
      page.locator('input[id*="cgc" i]'),
      page.locator('input[maxlength="8"]'),
      page.locator('input[maxlength="10"]'),
    ],
    keywords: ['CNPJ BASE', 'CNPJ', 'CGC'],
    preferredMaxLengths: [8, 10],
  });
}

async function waitForPgeShell(page: Page): Promise<void> {
  const deadline = Date.now() + config.pgeSpNavigationTimeoutMs;
  while (Date.now() < deadline) {
    const text = normalize(await page.locator('body').innerText().catch(() => ''));
    if (
      text.includes('EMITIR E-CRDA')
      || text.includes('CERTIDAO DE REGULARIDADE FISCAL')
      || (text.includes('CNPJ BASE') && text.includes('CPF'))
    ) return;
    await page.waitForTimeout(400);
  }
  throw new Error('A estrutura principal de emissão da e-CRDA não foi apresentada.');
}

async function detectUnavailable(page: Page): Promise<string | undefined> {
  const raw = await page.locator('body').innerText().catch(() => '');
  const text = normalize(raw);
  return unavailableText(text)
    ? firstSafeSentence(raw) || 'O portal da PGE-SP está indisponível.'
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
        code: 'CAPTCHA_PGE_SP_REQUER_INTERVENCAO',
        message: 'A PGE-SP exige validação humana e a política não permite intervenção.',
      };
    }
    if (intervencoes >= MAX_INTERVENCOES) {
      return {
        ok: false,
        code: 'CAPTCHA_PGE_SP_NAO_CONCLUIDO',
        message: 'A validação humana da PGE-SP não foi concluída após duas intervenções.',
      };
    }
    intervencoes += 1;
    await contexto.intervencao.aguardar({
      tipo: 'CAPTCHA',
      codigo: 'CAPTCHA_PGE_SP_NECESSARIO',
      resumo: 'O portal da PGE-SP solicitou validação humana.',
      tituloKey: 'certidoes.intervencaoPgeSpCaptcha.titulo',
      instrucaoKey: intervencoes === 1
        ? 'certidoes.intervencaoPgeSpCaptcha.instrucao'
        : 'certidoes.intervencaoPgeSpCaptcha.instrucaoNovaTentativa',
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
      erroCodigo: 'PORTAL_PGE_SP_INDISPONIVEL',
      erroResumo: outcome.message,
      retryable: true,
    };
  }
  if (outcome.kind === 'portal-changed') {
    return portalChanged('PORTAL_PGE_SP_ALTERADO', outcome.message);
  }
  if (outcome.kind === 'timeout') {
    return {
      status: 'FALHA',
      erroCodigo: 'TIMEOUT_RESULTADO_PGE_SP',
      erroResumo: 'O portal da PGE-SP não apresentou PDF nem resultado conclusivo no tempo esperado.',
      retryable: true,
    };
  }
  return portalChanged(
    'CAPTCHA_PGE_SP_NAO_CONCLUIDO',
    'O portal da PGE-SP continuou solicitando validação humana.',
  );
}

function negativeCertificateBlocked(text: string): boolean {
  return [
    'NAO E POSSIVEL EMITIR CERTIDAO NEGATIVA',
    'NAO FOI POSSIVEL EMITIR A CERTIDAO NEGATIVA',
    'CERTIDAO NEGATIVA NAO PODE SER EMITIDA',
    'FORAM LOCALIZADOS DEBITOS INSCRITOS',
    'EXISTEM DEBITOS INSCRITOS',
    'POSSUI DEBITOS INSCRITOS',
    'REQUERER CERTIDAO POSITIVA',
    'CERTIDAO POSITIVA COM EFEITOS DE NEGATIVA DEVERA SER REQUERIDA',
  ].some((marker) => text.includes(marker));
}
