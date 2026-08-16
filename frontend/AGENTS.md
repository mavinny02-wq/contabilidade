# Regras de agentes — frontend

Este arquivo especializa o contrato da raiz para `frontend/**`.

## Contrato de UI

- React + TypeScript; textos visíveis usam i18n `pt-BR`.
- Não hardcode texto visível em JSX/TSX.
- Não use `alert`, `prompt` ou `confirm`; use componentes e mensagens do produto.
- Preserve acessibilidade, teclado, foco, responsividade e estados de loading/erro/vazio.
- Não crie dados fake em telas reais.
- `indisponível`, `desconhecido`, `não consultado` e `regular/irregular` são estados diferentes.
- O frontend não reconstrói regra fiscal, permissão, prazo, custo ou transição pertencente ao backend.

## Tipagem e contratos

- Decodifique contratos externos de forma estrita.
- Não introduza `any`, casts amplos ou objetos multi-null para evitar atualizar callers.
- Mudança de contrato atualiza clientes/decoders/fixtures tipadas afetados no mesmo owner, quando
  autorizado.
- Componentes compartilhados e shell são hotspots; serialize owners conforme a matriz de ownership.

## Validação estrutural comum

```text
cd frontend
npm ci --no-audit --no-fund
npm run locale:validate
npm run typecheck
npm run build
```

Não execute Vitest, browser, coverage ou E2E em task comum. Testes exigem owner de validação
explicitamente liberado.
