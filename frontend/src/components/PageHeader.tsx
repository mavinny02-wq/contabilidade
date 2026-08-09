import type { ReactNode } from 'react';

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        {descricao ? <p>{descricao}</p> : null}
      </div>
      {acoes ? <div className="page-header__actions">{acoes}</div> : null}
    </header>
  );
}
