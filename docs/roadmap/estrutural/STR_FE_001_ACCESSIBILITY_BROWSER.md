# STR-FE-001 — acessibilidade e browser smoke

## Dispatch

```bash
python3 scripts/orchestration/dispatch_guard.py \
  --wave CONTABILIDADE_FAST_LANE_WAVE_007 --item STR-FE-001 --baseline d4c5391ebcf44b9fc7d3a7db7a488a5e7564889b \
  --key 8879bbc739dfa5cc339b4150f6650bcdd854190bc864bdd00db987941bd85d29 --github-aware --register
```

## Owner

Pode alterar frontend relacionado a acessibilidade, testes, configuração de teste e uma dependência
dev pinada quando tecnicamente necessária. APIs, permissões, regras de negócio e backend são
read-only.

## Escopo rápido

- AppShell, navegação principal e busca;
- Modal e error/loading boundaries;
- rotas representativas de Empresas, Documentos, Certidões e Console;
- teclado, ordem de foco, foco visível, retorno de foco e Escape;
- nomes acessíveis, landmarks, headings, labels e mensagens de erro;
- browser smoke local-only com dados/mocks sintéticos.

## Aceite

- zero violação `critical` ou `serious` nas páginas cobertas;
- modal mantém foco, fecha por Escape quando permitido e devolve foco ao trigger;
- navegação completa sem mouse;
- loading/falha de chunk anunciados de forma acessível;
- i18n, typecheck, suíte, build e limite de chunk continuam verdes;
- nenhuma rede externa;
- findings não corrigidos recebem regra, seletor e severidade, sem screenshot sensível.

Não ampliar para redesign visual. Defeito fora do owner vira successor.
