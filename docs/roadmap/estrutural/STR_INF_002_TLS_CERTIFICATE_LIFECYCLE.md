# STR-INF-002 — lifecycle TLS e certificados

**Status:** `RELEASED_FOR_EXECUTION`
**Wave:** `CONTABILIDADE_FAST_LANE_WAVE_012`
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Migration:** `NONE`

## Problema

O produto possui decisão aberta para TLS/DNS internos, mas ainda não há contrato machine-readable
para listeners, hostnames, SANs, expiração, algoritmos, origem, renovação, exceções e evidência. Sem
esse guard, um ambiente pode aceitar certificado vencido, hostname não coberto, chave fraca ou HTTP
externo sem detecção consistente.

## Escopo

Criar somente:

- `scripts/security/tls/**`;
- `infra/tls/**`;
- schema e policy versionados;
- inventário redigido;
- fixtures e testes sintéticos;
- workflow dedicado;
- `docs/implementacao/STR_INF_002_RESULT.md`.

Compose, Nginx, Keycloak, backend, DNS real, certificados reais, private keys e trust stores são
somente leitura.

## Contrato mínimo

Cada endpoint TLS governado declara:

- `endpointId`;
- ambiente;
- listener/protocolo/porta;
- hostname esperado;
- source type;
- owner;
- renewal owner/procedure;
- warning/critical days;
- algoritmos e tamanhos permitidos;
- política de self-signed;
- exceção com motivo e expiração, quando necessária.

Fixtures de certificado usam apenas metadados sintéticos:

- subject/SAN;
- notBefore/notAfter;
- issuer fingerprint sintético;
- public-key algorithm/size;
- serial sintético.

Nunca armazenar PEM, private key, password, token, keystore ou conteúdo de certificado real.

## Regras obrigatórias

Falhar para:

- certificado vencido ou ainda não válido;
- SAN sem o hostname esperado;
- algoritmo/tamanho proibido;
- source desconhecido;
- owner ou renovação ausentes;
- HTTP externo não autorizado;
- self-signed em on-premise/prod sem exceção válida;
- exceção vencida;
- saída contendo material sensível.

Classificar indisponibilidade de endpoint externo como `ENVIRONMENT_LIMITATION`, nunca como
certificado válido.

## Validação

- inventário gerado duas vezes e comparado byte a byte;
- testes de SAN, expiração, warning/critical, algoritmo, source, self-signed, exceção e redaction;
- JSON Schema e policy parseáveis;
- workflow YAML parseável;
- `git diff --check`.

## Aceite

- saída determinística e redigida;
- zero private key/certificado real;
- zero mutação de host ou configuração runtime;
- findings contêm apenas regra, localização abstrata e fingerprint;
- resultado explica claramente o que continua dependendo de runtime TLS real.

`STR_INF_002_RELEASED`
