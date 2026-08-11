# Prompts preparados

`GATE-VAL-001` recebeu uma validação parcial no Codex Cloud integrada pela PR `#9`.

Já estão comprovados nessa evidência:

- lockfiles versionados;
- frontend `npm ci`, i18n, typecheck e build;
- worker `npm ci`, typecheck, build e startup sem crash de import do PDF.js.

O gate continua aberto porque o runner não possuía Windows, Docker, `.env`, Node suportado nem acesso
Maven suficiente para comprovar a stack. Ainda são obrigatórias as provas locais de Maven, Compose,
PostgreSQL/Flyway, Keycloak/Liquibase, BAT, endpoints, interface e parser com PDF sintético.

Os arquivos `PREVIEW_SLOT_*` continuam apenas como candidatos da próxima onda. Eles não estão
selecionados e não devem ser executados até que a classificação geral do relatório
`docs/operacao/VALIDACAO_RUNTIME_COMPLETA_V051.md` seja promovida para `VERDE` por evidência Windows
no mesmo commit de `main`.
