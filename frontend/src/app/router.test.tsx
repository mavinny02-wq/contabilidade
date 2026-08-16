import { lazy } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouteLoadingBoundary } from './router';

const PendingPage = lazy(() => new Promise<never>(() => undefined));
const FailedPage = lazy(() => Promise.reject(new Error('chunk unavailable')));

describe('RouteLoadingBoundary', () => {
  it('shows the accessible localized fallback while a route chunk loads', () => {
    render(<RouteLoadingBoundary><PendingPage /></RouteLoadingBoundary>);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando aplicação...');
  });

  it('shows a controlled error when a route chunk fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<RouteLoadingBoundary><FailedPage /></RouteLoadingBoundary>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dados.');
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument();
  });
});
