import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { api, type ApiError } from '../../api/http';
import type { Intervencao } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';

type TicketSessao = {
  sessionId: string;
  eventsUrl: string;
  inputUrl: string;
  infoUrl: string;
  expiraEm: string;
};

type SessionInfo = {
  sessionId: string;
  executionId: string;
  createdAt: string;
  expiresAt: string;
  state: SessionState;
  width: number;
  height: number;
};

type SessionState = 'AGUARDANDO' | 'CONTINUANDO' | 'RETOMADA' | 'ENCERRADA' | 'EXPIRADA';

type StreamEvent =
  | {
      type: 'frame';
      data: string;
      width: number;
      height: number;
      pageScaleFactor: number;
      timestamp: number;
    }
  | {
      type: 'state';
      state: SessionState;
      expiresAt?: string;
      code?: string;
    }
  | { type: 'keepalive'; timestamp: string; state: SessionState }
  | { type: 'closed'; reason: string };

export function InteractiveSessionModal({
  intervencao,
  aberto,
  aoFechar,
  aoContinuar,
}: {
  intervencao?: Intervencao;
  aberto: boolean;
  aoFechar: () => void;
  aoContinuar: () => void;
}) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<EventSource | undefined>(undefined);
  const frameSequenceRef = useRef(0);
  const lastMoveRef = useRef(0);
  const [ticket, setTicket] = useState<TicketSessao>();
  const [info, setInfo] = useState<SessionInfo>();
  const [state, setState] = useState<SessionState>('AGUARDANDO');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState<ApiError | Error>();
  const [textInput, setTextInput] = useState('');

  const closeStream = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = undefined;
    setConnected(false);
  }, []);

  const drawFrame = useCallback((event: Extract<StreamEvent, { type: 'frame' }>) => {
    const sequence = ++frameSequenceRef.current;
    const image = new Image();
    image.onload = () => {
      if (sequence !== frameSequenceRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.max(1, event.width);
      canvas.height = Math.max(1, event.height);
      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = `data:image/jpeg;base64,${event.data}`;
  }, []);

  const connect = useCallback((sessionTicket: TicketSessao) => {
    closeStream();
    const source = new EventSource(sessionTicket.eventsUrl);
    sourceRef.current = source;
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as StreamEvent;
        if (event.type === 'frame') drawFrame(event);
        if (event.type === 'state') {
          setState(event.state);
          if (event.state === 'EXPIRADA') {
            setError(new Error(t('intervencoes.sessao.expirada')));
          }
        }
        if (event.type === 'closed') {
          setConnected(false);
          setState('ENCERRADA');
        }
      } catch {
        setError(new Error(t('intervencoes.sessao.eventoInvalido')));
      }
    };
  }, [closeStream, drawFrame, t]);

  useEffect(() => {
    if (!aberto || !intervencao) return undefined;
    let active = true;
    setLoading(true);
    setError(undefined);
    setTicket(undefined);
    setInfo(undefined);
    setState('AGUARDANDO');
    setContinuing(false);
    frameSequenceRef.current = 0;

    void api<TicketSessao>(`/intervencoes/${intervencao.id}/sessao`)
      .then(async (sessionTicket) => {
        if (!active) return;
        setTicket(sessionTicket);
        const response = await fetch(sessionTicket.infoUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(t('intervencoes.sessao.naoDisponivel'));
        const sessionInfo = await response.json() as SessionInfo;
        if (!active) return;
        setInfo(sessionInfo);
        setState(sessionInfo.state);
        connect(sessionTicket);
      })
      .catch((exception) => {
        if (active) setError(exception as ApiError | Error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      closeStream();
    };
  }, [aberto, closeStream, connect, intervencao, t]);

  const send = useCallback(async (payload: Record<string, unknown>) => {
    if (!ticket) throw new Error(t('intervencoes.sessao.naoDisponivel'));
    const response = await fetch(ticket.inputUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let code = `HTTP_${response.status}`;
      try {
        const body = await response.json() as { codigo?: string };
        code = body.codigo ?? code;
      } catch {
        // Mantém código HTTP seguro.
      }
      throw new Error(code);
    }
  }, [t, ticket]);

  const point = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * canvas.width,
      y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * canvas.height,
    };
  }, []);

  const pointerClick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const coordinates = point(event);
    canvasRef.current?.focus();
    void send({ type: 'pointer', action: 'click', ...coordinates, button: 'left' })
      .catch((exception) => setError(exception as Error));
  };

  const pointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const now = performance.now();
    if (now - lastMoveRef.current < 50) return;
    lastMoveRef.current = now;
    const coordinates = point(event);
    void send({ type: 'pointer', action: 'move', ...coordinates })
      .catch(() => undefined);
  };

  const wheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const coordinates = {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * canvas.width,
      y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * canvas.height,
    };
    void send({
      type: 'wheel',
      ...coordinates,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
    }).catch((exception) => setError(exception as Error));
  };

  const keyboard = (
    event: ReactKeyboardEvent<HTMLCanvasElement>,
    action: 'down' | 'up',
  ) => {
    if (['Tab', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    void send({
      type: 'key',
      action,
      key: event.key,
      code: event.code,
      text: action === 'down' && event.key.length === 1 ? event.key : undefined,
      modifiers: modifiers(event),
    }).catch((exception) => setError(exception as Error));
  };

  const sendText = async (event: FormEvent) => {
    event.preventDefault();
    if (!textInput) return;
    try {
      await send({ type: 'text', text: textInput });
      setTextInput('');
      canvasRef.current?.focus();
    } catch (exception) {
      setError(exception as Error);
    }
  };

  const continueAutomation = async () => {
    setContinuing(true);
    setError(undefined);
    try {
      await send({ type: 'continue' });
      setState('CONTINUANDO');
      closeStream();
      aoContinuar();
    } catch (exception) {
      setError(exception as Error);
      setContinuing(false);
    }
  };

  const message = obterMensagemErro(error);

  return (
    <Modal
      aberto={aberto}
      titulo={t('intervencoes.sessao.titulo')}
      aoFechar={aoFechar}
      className="modal--interactive"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            {t('acoes.fechar')}
          </Button>
          <Button
            disabled={!connected || continuing || state !== 'AGUARDANDO'}
            onClick={() => void continueAutomation()}
          >
            {t('intervencoes.sessao.continuarAutomacao')}
          </Button>
        </>
      }
    >
      <div className="interactive-session">
        <div className="interactive-session__header">
          <div>
            <strong>{intervencao ? t(intervencao.tituloKey) : ''}</strong>
            <p>{intervencao ? t(intervencao.instrucaoKey) : ''}</p>
          </div>
          <div className="interactive-session__status">
            <StatusBadge tom={connected ? 'sucesso' : 'aviso'}>
              {t(connected ? 'intervencoes.sessao.conectada' : 'intervencoes.sessao.desconectada')}
            </StatusBadge>
            <StatusBadge tom={state === 'AGUARDANDO' ? 'info' : 'neutro'}>
              {t(`intervencoes.sessao.status.${state}`)}
            </StatusBadge>
          </div>
        </div>

        {message ? <Alert tipo="erro" onClose={() => setError(undefined)}>{message}</Alert> : null}
        {loading ? <Alert tipo="info">{t('intervencoes.sessao.carregando')}</Alert> : null}

        <div className="interactive-session__viewport">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            aria-label={t('intervencoes.sessao.viewport')}
            onPointerMove={pointerMove}
            onPointerUp={pointerClick}
            onWheel={wheel}
            onKeyDown={(event) => keyboard(event, 'down')}
            onKeyUp={(event) => keyboard(event, 'up')}
            onContextMenu={(event) => event.preventDefault()}
          />
          {!connected ? (
            <div className="interactive-session__overlay">
              {t('intervencoes.sessao.aguardandoImagem')}
            </div>
          ) : null}
        </div>

        <form className="interactive-session__text" onSubmit={(event) => void sendText(event)}>
          <label className="field">
            <span>{t('intervencoes.sessao.enviarTexto')}</span>
            <input
              value={textInput}
              maxLength={500}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder={t('intervencoes.sessao.enviarTextoPlaceholder')}
            />
          </label>
          <Button type="submit" variante="secundario" disabled={!connected || !textInput}>
            {t('intervencoes.sessao.enviar')}
          </Button>
        </form>

        <div className="interactive-session__meta">
          {info ? <span>{t('intervencoes.sessao.resolucao')}: {info.width} × {info.height}</span> : null}
          {ticket ? <span>{t('intervencoes.sessao.ticketExpira')}: {formatDate(ticket.expiraEm)}</span> : null}
          <span>{t('intervencoes.sessao.avisoPrivacidade')}</span>
        </div>
      </div>
    </Modal>
  );
}


function obterMensagemErro(error: ApiError | Error | undefined): string | undefined {
  if (!error) return undefined;
  if ('mensagem' in error && typeof error.mensagem === 'string') return error.mensagem;
  if ('message' in error && typeof error.message === 'string') return error.message;
  return undefined;
}

function modifiers(event: ReactKeyboardEvent): number {
  let value = 0;
  if (event.altKey) value |= 1;
  if (event.ctrlKey) value |= 2;
  if (event.metaKey) value |= 4;
  if (event.shiftKey) value |= 8;
  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
