import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  titulo,
}: {
  children: ReactNode;
  className?: string;
  titulo?: string;
}) {
  return (
    <section className={`card ${className}`.trim()}>
      {titulo ? <h2 className="card__title">{titulo}</h2> : null}
      {children}
    </section>
  );
}
