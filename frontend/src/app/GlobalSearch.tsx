import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/http';
import type { ResultadoBusca } from '../api/types';

export function GlobalSearch() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, []);

  useEffect(() => {
    const valor = termo.trim();
    if (valor.length < 2) {
      setResultados([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setCarregando(true);
      void api<{ resultados: ResultadoBusca[] }>(`/busca?termo=${encodeURIComponent(valor)}`)
        .then((response) => {
          setResultados(response.resultados);
          setAberto(true);
        })
        .finally(() => setCarregando(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [termo]);

  const abrir = (resultado: ResultadoBusca) => {
    setAberto(false);
    setTermo('');
    navigate(resultado.destino);
  };

  return (
    <div className="global-search" ref={containerRef}>
      <span className="global-search__icon" aria-hidden="true">⌕</span>
      <input
        value={termo}
        onChange={(event) => setTermo(event.target.value)}
        onFocus={() => termo.trim().length >= 2 && setAberto(true)}
        placeholder={t('busca.placeholder')}
        aria-label={t('busca.placeholder')}
      />
      {carregando ? <span className="global-search__loading" aria-hidden="true">…</span> : null}
      {aberto ? (
        <div className="global-search__results">
          {termo.trim().length < 2 ? (
            <p>{t('busca.digiteMais')}</p>
          ) : resultados.length === 0 ? (
            <p>{t('busca.semResultados')}</p>
          ) : (
            resultados.map((resultado) => (
              <button type="button" key={`${resultado.tipo}-${resultado.id}`} onClick={() => abrir(resultado)}>
                <strong>{resultado.titulo}</strong>
                {resultado.subtitulo ? <span>{resultado.subtitulo}</span> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
