# Roadmap do produto — roteador atual

## Autoridade operacional

O checkpoint de execução é:

`docs/orquestracao/CONTABILIDADE_CURRENT_STATE.md`

O backlog estrutural é:

`docs/roadmap/BACKLOG_ESTRUTURAL.md`

O catálogo permanente de capacidades continua em `docs/roadmap/REGISTRO_ITENS_ROADMAP.md` e nos
backlogs por domínio. Este arquivo não duplica mais SHA, PRs, wave ou status de runtime.

## Regra de seleção

- funcionalidades novas permanecem bloqueadas até a campanha Windows dev ficar verde;
- correções comprovadas, guards, testes e boundaries estruturais podem continuar em fast lanes;
- cada wave contém de um a cinco owners reais, nunca filler;
- no máximo um migration owner;
- documentação que o orquestrador pode atualizar diretamente não consome slot Codex;
- providers reais, chamadas pagas, credenciais e dados reais são negados por padrão.

## Caminho para produto

1. fechar Windows dev e segundo startup;
2. provar on-premise/Keycloak;
3. executar restore/recovery e promoção/rollback;
4. observar Required CI e habilitar proteção da `main`;
5. selecionar o primeiro horizonte funcional do backlog 360 conforme dependências e locks.

## Estado atual

A Fast Lane Wave 010 está liberada para cinco owners estruturais/corretivos. Nenhuma nova
funcionalidade contábil foi autorizada por essa liberação.

`ROADMAP_PRODUTO_ROUTER_CURRENT_STATE`
