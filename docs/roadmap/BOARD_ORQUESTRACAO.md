# Board de Orquestração

## Checkpoint

- branch de integração: `main`;
- versão atual: `0.5.1`;
- validação Cloud canônica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime histórica/parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- merge da validação Cloud mais recente: PR `#12`, commit `6c101a3a0699cd843e9257f685550c61d662360f`;
- classificação Cloud: `CLOUD_AMARELO`;
- lockfiles versionados: comprovado;
- frontend `npm ci`/i18n/typecheck/build no Codex Cloud: comprovado;
- worker `npm ci`/typecheck/build, startup e PDF sintético no Codex Cloud: comprovado;
- sintaxe YAML/JSON/shell e revisão estática de Compose, Dockerfiles, BAT, PowerShell e migrations V1–V7: comprovadas no limite Cloud;
- backend Maven no Cloud: bloqueado por HTTP 403 do registry, sem evidência de defeito no código;
- `SEC-AUT-001`: implementado por autorização direta, aguardando validação runtime;
- migration atribuída a `SEC-AUT-001`: `V8__interactive_session_ticket_replay.sql`;
- gate ativo: `GATE-VAL-001`;
- validação ainda obrigatória: ambiente-alvo Windows com JDK 21, Node suportado, Maven e Docker Desktop;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`; não criar outra task Codex fingindo acesso ao Windows;
- slots oficiais selecionados: zero enquanto o gate não estiver verde;
- próxima onda: quatro candidatos remanescentes e uma vaga a recompor após reconciliação.

## SEC-AUT-001 — implementação antecipada

O usuário autorizou a implementação do anti-replay antes do fechamento do gate. O item:

- não é mais um preview executável;
- permanece `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`;
- consome `jti` uma única vez no PostgreSQL;
- troca o ticket por um grant HttpOnly no worker;
- mantém no máximo um grant ativo por sessão;
- não fecha o gate;
- não autoriza a execução dos demais candidatos.

Evidência:

```text
docs/implementacao/SEC_AUT_001_ANTI_REPLAY_SESSAO.md
```

## Provas ainda necessárias para fechar o gate

Todas devem partir do mesmo commit atualizado de `main`:

1. `mvn -B clean verify` verde em ambiente com JDK 21 e acesso funcional ao repositório Maven;
2. frontend e worker verdes no Windows com Node 22.12 ou superior;
3. `docker compose config` efetivo para `dev` e `onpremise` com o `.env` local, sem expor segredos;
4. execução do `START_CONTABILIDADE.bat dev` sem chamadas fiscais externas;
5. imagens artifact-only reais construídas e verificadas no Docker Desktop;
6. `postgres` saudável e `postgres-bootstrap` finalizado com código `0`;
7. Keycloak/Liquibase e Flyway V1–V8 validados por `scripts/validate-database-state.bat dev`;
8. backend, worker e frontend saudáveis, sem restart loop;
9. endpoints técnicos, proxies e smoke da interface aprovados;
10. primeira troca do ticket, replay, grant HttpOnly e restart do worker validados;
11. aplicação deixada rodando em `http://localhost:8088` durante a prova.

A extração com PDF sintético já foi comprovada no runtime Linux do Codex Cloud. Ela não precisa ser
repetida apenas por formalidade no Windows; o que continua pendente é comprovar o empacotamento e a
execução da imagem artifact-only do worker no Docker real.

A coleta dessa evidência é humana: o usuário executa os scripts locais e salva a saída no relatório
canônico. Depois, uma task `CODEX_CLOUD_LINUX` reconcilia o commit de evidência.

## Regra de promoção

Os prompts remanescentes só podem ser promovidos a slots oficiais depois que a evidência local for
anexada ao relatório runtime e a classificação geral mudar para `VERDE`. `SEC-AUT-001` não deve ser
executado novamente. Uma quinta vaga deve ser selecionada na reconciliação posterior ao gate.

## Candidatos remanescentes após o gate

1. `PERF-CRT-001` — consultas limitadas no scheduler de certidões;
2. `OPS-BKP-001` — manifesto/verificação de backup;
3. `OBS-WRK-001` — heartbeat vencido/degradado na Console Técnica;
4. `SEC-DOC-001` — verificação de integridade do storage.

Os quatro candidatos não possuem dependência entre si. A quinta vaga ainda não foi selecionada.
