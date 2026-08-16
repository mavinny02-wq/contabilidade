# STR-SEC-001 — guard de segredos e PII

**Objetivo:** detectar segredo, credencial, cookie, token e PII insegura em código, logs, fixtures e
resultados.

## Pré-requisito

Análise de baseline e política de falso-positivo.

## Limites

- não enviar conteúdo a serviço externo sem decisão;
- não armazenar valor detectado em relatório;
- diferenciar exemplo seguro de segredo real;
- CNPJ empresarial não implica autorização para dados pessoais vinculados.

## Aceite

Guard local/CI, redaction, allowlist governada e testes sintéticos.
