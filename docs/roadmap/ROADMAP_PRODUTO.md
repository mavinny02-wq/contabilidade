# Roadmap do produto

## Checkpoint

- baseline integrada: `0.5.1`;
- commit da onda de segurança/performance/operação: `b50fd182e4e4e1d0c1573bcb9e43fd8ff368cf01`;
- commit após a exportação CSV: `99df51e9b37195692e35c6651fafb10905f83b32`;
- validação Cloud canônica histórica: `docs/operacao/VALIDACAO_CLOUD_COMPLETA_V051.md`;
- validação runtime histórica/parcial: `docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md`;
- classificação do gate: `IMPLEMENTACOES_ATUAIS_RUNTIME_LOCAL_PENDENTE`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: ainda não selecionada.

## Itens implementados por autorização direta

As PRs `#14` a `#18` integraram:

1. `SEC-AUT-001` — anti-replay de tickets da sessão interativa;
2. `PERF-CRT-001` — lotes bounded no scheduler de certidões;
3. `OPS-BKP-001` — manifesto e verificação de backups;
4. `OBS-WRK-001` — heartbeat atrasado/expirado na Console Técnica;
5. `SEC-DOC-001` — integridade do storage antes do download.

A PR `#20` integrou:

6. `EXP-CRT-001` — exportação CSV filtrável do Centro de Certidões.

Os seis itens estão `IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`. Nenhum provider fiscal foi acionado
durante as implementações.

## Resultados preparados

### Segurança

- migration V8 e ledger de `jti` consumido;
- ticket usado somente na troca inicial e grant HttpOnly para eventos/comandos;
- recálculo de tamanho e SHA-256 antes do download documental;
- auditoria isolada quando a evidência diverge;
- proteção contra fórmula de planilha no CSV.

### Performance e operação

- inicialização, agendamento e alertas de certidões em lotes configuráveis;
- queries de IDs bounded, cursores rotativos e transações por item;
- backup com manifesto, versão, tamanhos e SHA-256;
- verificação não destrutiva em PowerShell e shell;
- exportação CSV lida em lotes e possui limite configurável.

### Observabilidade e uso operacional

- classificação de worker saudável, degradado e indisponível;
- exibição de último heartbeat, idade e motivo seguro;
- exportação respeita filtros de empresa, tipo e status exibido;
- operação de exportação gera auditoria sem conteúdo fiscal sensível.

## Gate imediato — execução humana local

1. atualizar a main para o commit atual;
2. executar Maven Java 21, frontend e worker com Node suportado;
3. validar Compose `dev` e `onpremise`;
4. executar `START_CONTABILIDADE.bat dev`;
5. comprovar imagens artifact-only e serviços saudáveis;
6. validar Keycloak/Liquibase e Flyway V1–V8;
7. executar endpoints e smoke UI;
8. provar anti-replay, lotes, backup, heartbeat, integridade documental e exportação CSV;
9. anexar a evidência ao relatório runtime;
10. executar uma task Cloud apenas para reconciliar o commit de evidência.

A evidência Cloud da PR `#12` é histórica e não substitui build/runtime da main atual, porque backend,
worker e frontend foram alterados depois daquela prova.

## Próxima onda

Ainda não há IDs selecionados nem prompts executáveis. A próxima onda deve ser criada somente após o
gate verde e terá exatamente cinco slots independentes com ownership sem sobreposição crítica.

Nenhum provider externo deve ser acionado durante o gate ou durante reconciliações.
