# Arquitetura de integrações

## Tipos

- `API_OFICIAL`;
- `API_COMERCIAL`;
- `PORTAL_AUTOMATIZADO`;
- `PORTAL_ASSISTIDO`;
- `MANUAL`.

## Modos do worker

O registry do worker diferencia explicitamente:

```text
API
└── execução HTTP sem browser

PORTAL
└── Playwright + eventual sessão humana
```

Um browser indisponível não impede automaticamente um fluxo API configurado. O health check publica
capacidade, modo e diagnóstico seguro por provider.

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

O payload de cada execução inclui timeout, custo unitário estimado e moeda do provider selecionado.
Quando há fallback, esses parâmetros são substituídos pelos dados do próximo provider.

## Providers atuais

- `SERPRO` — API oficial Consulta CND implementada e desabilitada por padrão;
- `FEDERAL_PORTAL` — portal assistido Federal;
- `SEFAZ_SP_PORTAL` — portal assistido SEFAZ-SP;
- `PGE_SP_PORTAL` — portal assistido PGE-SP;
- `INFOSIMPLES` — definição futura sem client;
- `MANUAL` — contingência operacional.

O domínio de Certidões não conhece OAuth2, Playwright, Serpro ou fornecedor comercial. Todos os
providers retornam o mesmo contrato normalizado.
