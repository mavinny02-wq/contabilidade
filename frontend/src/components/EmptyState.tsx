import type { ReactNode } from 'react';

export function EmptyState({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">○</div>
      <h2>{titulo}</h2>
      {descricao ? <p>{descricao}</p> : null}
      {acao}
    </div>
  );
}
