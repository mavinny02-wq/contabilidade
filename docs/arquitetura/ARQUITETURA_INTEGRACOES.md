# Arquitetura de integrações

## Tipos

- `API_OFICIAL`;
- `API_COMERCIAL`;
- `PORTAL_AUTOMATIZADO`;
- `PORTAL_ASSISTIDO`;
- `MANUAL`.

## Política futura

Por operação e jurisdição:

- provider primário;
- fallbacks;
- retries técnicos;
- timeout;
- intervenção humana;
- timeout humano;
- fallback pago;
- limite de custo.

O domínio chama um roteador e recebe resultado normalizado. Serpro, InfoSimples e Playwright são
implementações substituíveis.
