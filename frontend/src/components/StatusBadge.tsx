export function StatusBadge({
  children,
  tom = 'neutro',
}: {
  children: string;
  tom?: 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro';
}) {
  return <span className={`status-badge status-badge--${tom}`}>{children}</span>;
}
