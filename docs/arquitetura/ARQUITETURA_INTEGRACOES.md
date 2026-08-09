# Arquitetura de integrações

## Tipos

- `API_OFICIAL`;
- `API_COMERCIAL`;
- `PORTAL_AUTOMATIZADO`;
- `PORTAL_ASSISTIDO`;
- `MANUAL`.

## Política implementada

Cada operação possui:

- lista ordenada de providers;
- intervenção humana permitida ou bloqueada;
- timeout humano;
- fallback pago;
- custo máximo;
- moeda;
- status habilitado.

O roteador considera somente providers habilitados e permitidos. API paga entra quando é o primeiro
provider explicitamente configurado ou quando o fallback pago está autorizado. Limites de custo
bloqueiam preço desconhecido ou moeda incompatível.

## Contrato

O domínio cria uma execução com provider, payload normalizado e idempotency key. O worker ou
integração conclui, falha ou solicita intervenção. O lifecycle handler atualiza o domínio sem expor o
payload específico ao frontend.

Serpro, InfoSimples e Playwright permanecem implementações substituíveis. Somente o provider manual
está operacional nesta versão.
