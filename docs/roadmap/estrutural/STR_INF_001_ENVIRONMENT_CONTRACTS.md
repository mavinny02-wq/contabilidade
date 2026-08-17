# STR-INF-001 — contratos determinísticos de ambiente

**Prioridade:** `P1`
**Status:** `RELEASED_FOR_EXECUTION`
**Tipo:** tooling/guard; configurações runtime read-only
**Migration:** `NONE`

## Objetivo

Criar uma autoridade machine-readable que compare os contratos de `dev`, `onpremise` e CI sem
duplicar segredos nem inferir produção. O guard deve detectar drift entre Compose, configuração
Spring, runtime config do frontend, worker, `.env.example` e workflows.

## Invariantes mínimas

### Dev

- autenticação desabilitada somente no perfil/Compose dev;
- Keycloak e bootstrap ausentes;
- providers reais e chamadas pagas desabilitados;
- PostgreSQL, backend, worker e frontend como stack mínima;
- dados e credenciais reais proibidos.

### On-premise

- autenticação habilitada e Keycloak obrigatório;
- imagens fornecidas, sem Maven/npm/`docker build` no servidor;
- segredos de exemplo rejeitados;
- storage, backup e dados persistentes não são apagados pelo startup;
- provider real continua opt-in e sem credencial no repositório.

### CI

- dados sintéticos e rede externa bloqueada por padrão;
- nenhum claim de Windows/on-premise;
- versões pinadas conforme autoridades atuais;
- ausência de feed ou Docker é limitação explícita, nunca `PASS`.

## Entrega

- policy JSON versionada;
- inventário determinístico dos três ambientes;
- guard sem dependência externa;
- fixtures positivas e negativas;
- workflow dedicado;
- mensagens redigidas, sem valores de segredo;
- exceções somente com owner, motivo e expiração.

## Critérios de aceite

1. duas gerações produzem bytes idênticos;
2. auth-off fora de dev falha;
3. Keycloak ausente no on-premise falha;
4. provider real habilitado por padrão falha;
5. build no deploy on-premise falha;
6. segredo de exemplo aceito no on-premise falha;
7. endpoint público/wildcard inseguro inesperado falha;
8. nenhum arquivo runtime é modificado por esta task;
9. JSON/YAML, testes e `git diff --check` passam.

## Fora do escopo

Provisionar produção, escolher DNS/TLS, criar secrets, alterar `.env`, modificar Compose ou aplicar
qualquer correção encontrada. Drifts reais geram successors próprios.
