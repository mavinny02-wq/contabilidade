import { describe, expect, it } from 'vitest';
import i18n from './index';

describe('catalogos pt-BR das paginas recentes', () => {
  it.each([
    'menu.backups', 'menu.atualizacoes', 'menu.configuracaoSegura',
    'menu.historicoWorkers', 'responsaveisModulo.titulo', 'documentos.metadados.titulo',
  ])('resolve %s sem devolver a propria chave', (chave) => {
    expect(i18n.exists(chave)).toBe(true);
    expect(i18n.t(chave)).not.toBe(chave);
  });
});
