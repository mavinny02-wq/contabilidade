# Roadmap do produto

## Checkpoint

- versão declarada: `0.5.1`;
- commit final da onda mais recente: `0e310acecedf186bb62339e152bd7d5ee7bc0e2e`;
- PRs da onda mais recente: `#31` a `#35`;
- validação Cloud canônica é histórica para uma baseline anterior;
- classificação atual: `MULTIPLAS_ONDAS_IMPLEMENTADAS_RUNTIME_LOCAL_PENDENTE`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: não selecionada.

## Onda mais recente

A autorização direta do usuário produziu cinco slots independentes:

1. `EMP-HIS-001` — histórico cadastral da Empresa 360;
2. `CRT-BULK-001` — solicitação de certidões selecionadas em lote;
3. `AUT-LIM-001` — limites de recursos da sessão interativa;
4. `OPS-BKP-UI-001` — inventário e verificação read-only de backups;
5. `DOC-RET-001` — prévia read-only de retenção documental.

Os cinco itens foram integrados pelas PRs `#31` a `#35` e permanecem
`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`.

## Capacidades preparadas

### Empresas

- a aba Histórico deixou de ser placeholder;
- eventos da empresa e de seus estabelecimentos são obtidos da auditoria existente;
- paginação e ordenação decrescente;
- ator, data, recurso e correlation ID;
- `detalhes_json` não é exposto;
- `EMPRESA_LER` é suficiente sem conceder acesso à auditoria global.

### Certidões

- seleção individual e das certidões filtradas;
- até 500 IDs por chamada;
- deduplicação preservando ordem;
- idempotência derivada por acompanhamento;
- erro de negócio isolado por item;
- resultado de lote integral ou parcialmente aceito;
- nenhuma chamada direta a provider pelo endpoint de lote.

### Automação

- limite configurável de sessões interativas por worker;
- reserva de capacidade para criações concorrentes;
- limite de assinantes SSE por sessão;
- HTTP `429` quando a capacidade se esgota;
- limpeza de sessão parcialmente criada;
- capacidade agregada no health sem identificadores sensíveis.

### Backup

- nova página administrativa de inventário;
- validação de manifesto, ID, componentes, tamanho e paths;
- diretório montado como read-only no backend;
- verificação SHA-256 sob demanda;
- nenhuma criação, restauração, exclusão ou download pela interface;
- auditoria segura da verificação.

### Retenção documental

- simulação global ou por empresa;
- critérios configuráveis para inatividade, validade expirada e documento antigo sem validade;
- total real, amostra bounded e flag parcial;
- contagem por motivo e tamanho da amostra;
- zero alteração no PostgreSQL ou storage;
- execução futura de retenção continua fora do escopo e exige governança específica.

## Itens anteriores

Continuam integrados e aguardando prova runtime:

- primeira onda: `SEC-AUT-001`, `PERF-CRT-001`, `OPS-BKP-001`, `OBS-WRK-001`, `SEC-DOC-001`;
- adicionais: `EXP-CRT-001`, `EMP-FIL-001`;
- onda anterior: `EMP-IMP-001`, `AUT-SHD-001`, `CRT-DASH-001`, `AUD-EXP-001`, `DOC-ORP-001`.

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
