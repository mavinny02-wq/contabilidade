# Arquitetura de integrações

Tipos: `API_OFICIAL`, `API_COMERCIAL`, `PORTAL_AUTOMATIZADO`, `PORTAL_ASSISTIDO`, `MANUAL`.

O módulo de negócio chama um Roteador de Provedor e recebe resultado normalizado. Nunca conhece Playwright, Serpro ou fornecedor comercial diretamente.

Política configurável por operação/jurisdição: providers em prioridade, retries, timeout, intervenção humana, timeout humano, fallback pago e limite de custo.
