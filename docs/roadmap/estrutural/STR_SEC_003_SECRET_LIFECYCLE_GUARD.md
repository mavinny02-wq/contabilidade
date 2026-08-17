# STR-SEC-003 — inventário e ciclo de vida de segredos

**Status:** `RELEASED_FOR_EXECUTION`  
**Owner:** tooling/policy/fixtures/workflow de lifecycle de segredos  
**Migration:** `NONE`

## Problema

O repositório já detecta segredo/PII e impede valores reais em automação, mas ainda não existe um
contrato machine-readable que responda quais segredos são exigidos por ambiente, quem é o owner,
qual fonte é autorizada, quando rotacionar e como revogar em emergência.

## Objetivo

Criar um guard determinístico e totalmente redigido para governar metadados do ciclo de vida dos
segredos sem armazenar ou consultar os valores.

## Escopo permitido

- `scripts/security/secret-lifecycle/**`;
- policy, schema, fixtures e testes sintéticos;
- workflow dedicado;
- resultado da task.

`.env`, `.env.example`, Compose, Spring, Keycloak, providers e secret stores reais são somente
leitura.

## Contrato mínimo

Cada entrada deve declarar:

```text
secretId abstrato
ambientes
consumer/component
owner
sourceType autorizado
rotationDays
emergencyRevokeProcedureId
required/optional
```

Nenhum valor, hash reversível, tamanho, prefixo real ou última rotação de produção pode ser
persistido no inventário.

## Aceite

1. Inventário determinístico apenas com nomes abstratos e metadados seguros.
2. Fontes permitidas explicitamente versionadas, como variável de ambiente, arquivo montado ou
   secret store; source desconhecido falha fechado.
3. Entrada sem owner, política de rotação ou procedimento de revogação falha.
4. `rotationDays <= 0`, valor excessivo ou exceção expirada falha.
5. Secret exigido no on-premise não pode aceitar placeholder de exemplo como prova.
6. Findings exibem somente regra, arquivo/linha quando aplicável e fingerprint irreversível.
7. Fixtures cobrem missing owner, source inválido, rotação vencida, exceção válida/vencida,
   placeholder e redaction.
8. Duas gerações consecutivas do inventário são byte-idênticas.
9. Nenhuma rede, provider, vault real ou credencial é acessada.
10. Workflow dedicado executa schema, testes, geração determinística e guard.

`STR_SEC_003_READY`
