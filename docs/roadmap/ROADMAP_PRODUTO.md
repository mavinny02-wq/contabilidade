# Roadmap do produto — roteador atual

## Autoridade operacional

O checkpoint de execução é:

`docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`

O backlog estrutural é:

`docs/roadmap/BACKLOG_ESTRUTURAL.md`

O catálogo permanente de capacidades continua em `docs/roadmap/REGISTRO_ITENS_ROADMAP.md` e nos
backlogs por domínio. Este arquivo não duplica SHA, PRs ou evidência detalhada.

## Regra de seleção

- funcionalidades novas permanecem bloqueadas até a campanha Windows dev ficar verde;
- correções comprovadas, guards, testes, tooling de produção e boundaries podem continuar em fast lanes;
- cada wave contém de um a cinco owners reais, nunca filler;
- no máximo um migration owner;
- documentação que o orquestrador pode atualizar diretamente não consome slot Codex;
- providers reais, chamadas pagas, credenciais e dados reais são negados por padrão.

## Caminho para produto

1. fechar Windows dev e segundo startup;
2. provar on-premise/Keycloak;
3. completar tooling de secret lifecycle, recovery e promoção;
4. executar restore/recovery e promoção/rollback reais;
5. observar Required CI e habilitar proteção da `main`;
6. selecionar o primeiro horizonte funcional conforme dependências e locks.

## Estado atual

A Wave 010 foi consumida. A Fast Lane Wave 011 está liberada para:

- corrigir a negação 500/403;
- zerar os findings arquiteturais;
- governar lifecycle de segredos;
- validar bundles imutáveis de promoção/rollback;
- preparar recovery rehearsal sem tocar dados reais.

Nenhuma nova funcionalidade contábil foi autorizada por essa liberação.

`ROADMAP_PRODUTO_ROUTER_FAST_LANE_WAVE_011`
