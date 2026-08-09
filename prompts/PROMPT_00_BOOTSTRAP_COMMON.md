TASK: Criar a baseline técnica executável da plataforma Contabilidade
TYPE: IMPLEMENTACAO / BOOTSTRAP SERIAL
ITEM: HIST-FND-001
BASELINE: latest main
EXECUTION MODE: CLOUD_FIRST

Trabalhe somente no repositório fornecido pelo Codex Cloud.

## Orientação
Leia `AGENTS.md`, o Índice, Governança, Registro, Roadmap, Board e toda arquitetura ativa.

## Objetivo
Criar a baseline executável mínima, sem implementar módulos fiscais.

## Alvo
- backend Java/Spring Boot;
- frontend React + TypeScript;
- PostgreSQL/Flyway;
- Keycloak/OAuth2/JWT preparado para desenvolvimento;
- i18n frontend somente `pt-BR`, sem strings visíveis hardcoded;
- error contract comum com código, mensagemKey, correlationId e detalhes seguros;
- estrutura de módulos/pacotes para Common;
- configuração local documentada;
- README de execução.

## Exclusões
Não implementar Certidões, Obrigações, e-CAC, guias, integrações reais ou Playwright real. Não criar dados fake. Não criar microserviços. Não criar/rodar testes. Não hardcode segredos. Não introduzir dependência sem revisão de licença.

## Validação permitida
Compilação backend, build frontend, validação configuração/i18n e `git diff --check`.

## Saída
Arquivos lidos; arquitetura criada; versões/dependências e licenças; configuração; validação; decisões/bloqueios; arquivos alterados; Git final.
