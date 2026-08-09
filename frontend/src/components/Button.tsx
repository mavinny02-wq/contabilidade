import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'perigo' | 'texto';
  children: ReactNode;
};

export function Button({ variante = 'primario', className = '', children, ...props }: Props) {
  return (
    <button className={`button button--${variante} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
