# Linux Compose dev auth isolation result

- **Item:** `BUG-CI-CONTABILIDADE-LINUX-DEV-AUTH-ISOLATION-001`
- **Status:** `IMPLEMENTED_STRUCTURAL_GREEN_RUNTIME_RERUN_PENDING`
- **Classificação:** `PRODUCT_REGRESSION`
- **Baseline:** `a1b3c1afbc727f92b3a411131dcfe4a4c5d22782`
- **Run analisado:** `32581886001`, job `97052395642`

## Causa provada

O primeiro startup construiu as imagens e deixou PostgreSQL saudável; o bootstrap PostgreSQL saiu
com código zero. Depois, o workflow aguardou aproximadamente cinco minutos até o Keycloak ficar
`unhealthy`, bloqueando backend, worker e frontend. A segunda inicialização não começou.

O job executava `docker compose up` sem lista de serviços. Isso iniciava Keycloak/bootstrap no modo
dev e preservava os `depends_on` on-premise de backend/frontend. O contrato aceito exige somente
PostgreSQL, backend, worker e frontend no modo dev; corrigir apenas o healthcheck do Keycloak faria a
campanha validar a stack errada.

O rerun isolado `32582778203` comprovou a primeira correção: PostgreSQL, backend e worker ficaram
saudáveis sem Keycloak/bootstrap. Ele também revelou um segundo defeito no mesmo fluxo: o Nginx do
frontend resolvia `keycloak` estaticamente ao iniciar e entrava em restart quando o serviço
intencionalmente ausente não tinha endereço DNS.

## Correção e regressão

`compose.dev.yaml` agora substitui, em vez de mesclar, os `depends_on` de backend e frontend. O job
Linux sobe explicitamente apenas os quatro serviços dev nas duas tentativas e falha se qualquer
container Keycloak/bootstrap existir. O proxy `/auth` do frontend agora usa o DNS interno Docker com
resolução tardia; assim, a ausência dev não impede o Nginx de iniciar e o mesmo config continua
encaminhando `/auth` quando Keycloak existir no modo on-premise. A regressão estrutural exige os
overrides, o mesmo service scope nas duas inicializações, as duas verificações de ausência e proíbe
o upstream Keycloak estático no Nginx.

## Evidência

- regressão Cloud/Compose: **2/2 PASS**;
- environment contract: **9/9 PASS** e guard **PASS**;
- startup actions: **9/9 PASS** e guard **PASS**;
- Docker orchestration: **10/10 PASS** e guard **PASS**;
- required CI: **13/13 PASS** e guard **PASS**;
- secret/PII: **5/5 PASS** e guard **PASS**;
- context governance e orchestration governance: **PASS**, zero warnings;
- `git diff --check`: **PASS**.

O host local não possui Docker; o novo run isolado ainda será registrado no fechamento. Nenhum
reset, cleanup, remoção de volume, segredo, provider ou deploy externo faz parte da correção. O
runtime ainda não é declarado verde neste estado intermediário.
