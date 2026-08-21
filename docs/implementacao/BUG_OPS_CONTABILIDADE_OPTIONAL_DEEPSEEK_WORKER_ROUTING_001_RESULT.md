# BUG-OPS-CONTABILIDADE-OPTIONAL-DEEPSEEK-WORKER-ROUTING-001 result

## Status

`IMPLEMENTADO_ESTRUTURALMENTE_VALIDADO; START_RUNTIME_BLOQUEADO_PELO_AMBIENTE`

## Baseline

`bb55cbb73f97168d1e32bced2f70c4642b0f1840`

## Resultado

O repositório passa a possuir um router portátil para workers DeepSeek opcionais. Com
`DEEPSEEK_API_KEY`, o tier solicitado usa uma configuração Responses isolada; sem chave, o comando
Codex do chamador permanece exatamente sem overrides de modelo ou provedor. O orquestrador
primário conserva autoridade, revisão e aceite.

## Diagnóstico do repositório

- backend: Java 21, Spring Boot 3.5, Maven, Spring MVC/JPA/Security/OAuth2/Actuator, Flyway e
  PostgreSQL;
- frontend: React 19, TypeScript 5.9, Vite 7, i18next e Keycloak JS, com Node 22.12+;
- worker: Node/TypeScript, Playwright e boundary HTTP próprio;
- runtime: Compose com PostgreSQL 17, Keycloak 26, backend, worker e frontend/nginx;
- CI: gates de build/PostgreSQL/startup, governança, segurança/PII, supply chain, arquitetura,
  recovery e release;
- orquestração: v2 com gate P0 de startup ainda ativo; nenhuma wave de produto foi aberta nesta
  task.

## Owners alterados

- `scripts/ai/contabilidade_llm_worker.py`;
- `scripts/ai/tests/test_contabilidade_llm_worker.py`;
- `scripts/ai/context_governance_guard.py`;
- `scripts/ai/tests/test_context_governance_guard.py`;
- `scripts/verify-backup.ps1`;
- `scripts/tests/startup-preflight.Tests.ps1`;
- `docs/ai/CONTABILIDADE_OPTIONAL_EXTERNAL_LLM_WORKER_ROUTING.md`;
- `docs/ai/CONTEXTO_E_ORCAMENTO.md`;
- este RESULT_MD.

## Cobertura de regressão

A fixture direta cobre seleção Flash/Pro, fallback Codex sem chave, descoberta no ambiente do
usuário Windows, isolamento de `CODEX_HOME`, ausência da chave em argumentos/resumo, filtro do
segredo em shells, propagação do exit code e rejeição de overrides concorrentes, inclusive a forma
inline de `--config`. A fixture do guard cobre também a regressão preexistente que classificava a
proibição "não pré-carregue todos" como exigência de leitura universal.

O `doctor` revelou ainda um erro de parser preexistente no verificador de backup antes de qualquer
build ou Docker. O operador foi reposicionado para uma continuação PowerShell válida e a fixture de
startup agora aponta diretamente para a parseabilidade desse script de produção.

## Validação

- revisão externa bounded em DeepSeek Flash: encontrou dois blockers de fallback/argument parsing,
  ambos corrigidos antes do aceite; uso informado pelo executor: 12.209 tokens; duração observada:
  aproximadamente 60 s. Esses números medem somente essa revisão, não qualidade comparativa;
- `python -m py_compile` nos scripts e fixtures alterados: PASS;
- `python -m unittest discover -s scripts/ai/tests -p "test_*.py"`: PASS, 23 testes em 0,610 s;
- `python scripts/ai/context_governance_guard.py --repo-root . --base HEAD`: PASS, zero erros e
  warnings após correção do falso positivo preexistente;
- `python scripts/ai/contabilidade_llm_worker.py --tier flash --route-only`: PASS, DeepSeek
  selecionado sem geração e sem expor segredo;
- primeiro `START_CONTABILIDADE.bat doctor`: FAIL antes de toolchain/Docker, dois erros de parser em
  `scripts/verify-backup.ps1`;
- segundo `START_CONTABILIDADE.bat doctor`: parser PASS, 37 scripts; FAIL ambiental porque Docker
  CLI não existe no `PATH` nem nos dois caminhos padrão verificados;
- `START_CONTABILIDADE.bat check`: PASS; backend `test-compile` (171 fontes + 19 fixtures), locale,
  typecheck/build frontend e typecheck/build worker; nenhum container iniciado ou alterado;
- `python scripts/security/secret_pii_guard.py --root .`: FAIL preexistente em duas fixtures CPF de
  `automation-worker/src/observability/observability.test.ts`, owner não tocado;
- `git diff --check`: PASS, apenas avisos locais de conversão LF/CRLF.

## Limites

- nenhuma credencial é persistida ou exibida;
- nenhuma aplicação, banco ou serviço externo é alterado;
- nenhum push ou deploy é autorizado nesta task;
- start de runtime não foi executado: Docker está ausente neste host e o gate oficial de startup
  continua necessário em um ambiente com Docker Desktop/Compose;
- testes Pester de startup foram atualizados, mas sua execução permanece deferida para a campanha
  de validação autorizada; o mesmo owner foi provado estruturalmente pelo parser oficial do doctor.
