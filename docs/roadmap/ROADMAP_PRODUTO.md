# Roadmap do produto

## Checkpoint

- versão declarada: `0.5.1`;
- commit final da onda mais recente: `9fdfe8b2af8170397d49925027c55ad7e6365760`;
- PRs da onda mais recente: `#25` a `#29`;
- validação Cloud canônica é histórica para uma baseline anterior;
- classificação atual: `ONDAS_IMPLEMENTADAS_RUNTIME_LOCAL_PENDENTE`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: não selecionada.

## Onda mais recente

A autorização direta do usuário produziu cinco slots independentes:

1. `EMP-IMP-001` — importação CSV de empresas;
2. `AUT-SHD-001` — shutdown gracioso do automation worker;
3. `CRT-DASH-001` — dashboard gerencial de certidões;
4. `AUD-EXP-001` — filtros e exportação CSV da auditoria;
5. `DOC-ORP-001` — reconciliação read-only do storage documental.

Os cinco itens foram integrados pelas PRs `#25` a `#29` e permanecem
`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`.

## Capacidades preparadas

### Empresas

- modelo CSV UTF-8;
- validação sem gravação por padrão;
- detecção de delimitador, aspas e BOM;
- validação por linha, duplicidade no arquivo/banco e limites;
- importação pela mesma regra autoritativa do cadastro individual;
- relatório de válidas, importadas e rejeitadas.

### Automação

- `SIGTERM`/`SIGINT` interrompe novas aquisições;
- execução atual pode concluir durante o grace period;
- servidor HTTP e browser são fechados por último;
- timeout e segundo sinal não são mascarados como sucesso;
- Compose aguarda o prazo configurado antes de `SIGKILL`.

### Certidões

- consolidação gerencial bounded;
- distribuição por status e tipo;
- vencimentos em 30 dias e ausência de validade;
- regra de status compartilhada com o Centro de Certidões;
- indicador explícito quando o teto de análise produz visão parcial.

### Auditoria

- filtros de ação, recurso, ator e período;
- CSV paginado, com snapshot e limite;
- proteção contra fórmula de planilha;
- `detalhes_json` deliberadamente excluído;
- evento seguro de exportação.

### Documentos e storage

- comparação sob demanda de banco e filesystem;
- documentos ativos e inativos considerados;
- nenhum symlink seguido;
- nenhuma exclusão ou correção automática;
- paths substituídos por fingerprints;
- resultado conclusivo somente após varredura integral.

## Itens anteriores

Continuam integrados e aguardando prova runtime:

- `SEC-AUT-001`, `PERF-CRT-001`, `OPS-BKP-001`, `OBS-WRK-001`, `SEC-DOC-001`;
- `EXP-CRT-001` e `EMP-FIL-001`.

Nenhum provider fiscal foi acionado durante qualquer implementação.

## Gate imediato — execução humana local

1. atualizar a `main`;
2. executar Maven Java 21;
3. executar frontend e worker com Node suportado;
4. validar Compose `dev` e `onpremise`;
5. executar `START_CONTABILIDADE.bat dev`;
6. comprovar imagens artifact-only e serviços saudáveis;
7. validar Keycloak/Liquibase e Flyway V1–V8;
8. executar endpoints e smoke UI;
9. executar as provas focadas de todos os itens pendentes;
10. anexar a evidência ao relatório runtime;
11. executar uma task Cloud somente para reconciliar o commit de evidência.

A evidência Cloud da PR `#12` não substitui essa prova, pois a `main` foi amplamente modificada depois.

## Próxima onda

Nenhum novo slot será selecionado até a `main` atual obter classificação runtime `VERDE`. A próxima
onda continuará exigindo exatamente cinco itens independentes, ownership sem sobreposição crítica e
baseline única comprovada.
