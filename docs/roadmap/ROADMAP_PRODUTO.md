# Roadmap do produto

## Checkpoint

- versão declarada: `0.5.1`;
- commit final da onda mais recente: `d7e50e55ad7c2ee0dafbf48736d22507470e0c92`;
- PRs da onda mais recente: `#37` a `#41`;
- schema atual esperado: Flyway V1–V9;
- validação Cloud canônica é histórica para uma baseline anterior;
- classificação atual: `MULTIPLAS_ONDAS_IMPLEMENTADAS_RUNTIME_LOCAL_PENDENTE`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: não selecionada.

## Onda mais recente

A autorização direta do usuário produziu cinco slots independentes:

1. `EMP-GRP-001` — grupos e tags de empresas;
2. `CRT-CAL-001` — agenda de vencimentos de certidões;
3. `OBS-PRV-001` — histórico operacional e de custo dos providers;
4. `ADM-CFG-001` — configuração efetiva segura;
5. `DOC-PRE-001` — pré-visualização segura de documentos.

Os cinco itens foram integrados pelas PRs `#37` a `#41` e permanecem
`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`.

## Capacidades preparadas

### Empresas

- grupo opcional e até vinte tags por empresa;
- classificação separada do cadastro fiscal;
- deduplicação case-insensitive;
- busca por grupo e tag;
- card e modal próprios na Empresa 360;
- migration V9 com tabela e índices específicos.

### Certidões

- agenda por período de até 366 dias;
- filtro opcional por empresa;
- status calculado pelo mesmo domínio do Centro de Certidões;
- prazo até o vencimento;
- consulta bounded com total e flag parcial;
- nenhuma chamada fiscal durante a consulta.

### Providers e observabilidade

- consolidação histórica de sucesso, parcial, falha, indisponibilidade, cancelamento e estado aberto;
- taxa de sucesso e duração média;
- última execução;
- custo estimado separado por moeda;
- ausência deliberada de payload, resultado, protocolo, empresa ou segredo.

### Administração segura

- ambiente, versão, segurança e provider de storage;
- presença adequada de token do worker e segredo da sessão;
- estado seguro de Base URL, referência de segredo, custo e moeda por provider;
- alertas de valor padrão ou configuração incompleta;
- nenhum valor sensível retornado pela API.

### Documentos

- preview restrito a PDF, PNG e JPEG;
- nova verificação de tamanho e SHA-256 antes da resposta;
- headers inline restritivos;
- Blob URL temporária no frontend;
- formatos ativos não suportados continuam disponíveis somente por download.

## Itens anteriores

Continuam integrados e aguardando prova runtime todos os itens das PRs funcionais `#14` a `#35`.
Nenhum provider fiscal foi acionado durante qualquer implementação.

## Gate imediato — execução humana local

1. atualizar a `main`;
2. executar Maven Java 21;
3. executar frontend e worker com Node suportado;
4. validar Compose `dev` e `onpremise`;
5. executar `START_CONTABILIDADE.bat dev`;
6. comprovar imagens artifact-only e serviços saudáveis;
7. validar Keycloak/Liquibase e Flyway V1–V9;
8. executar endpoints e smoke UI;
9. executar as provas focadas de todos os itens pendentes;
10. anexar a evidência ao relatório runtime;
11. executar uma task Cloud somente para reconciliar o commit de evidência.

A evidência Cloud da PR `#12` não substitui essa prova, pois a `main` foi amplamente modificada depois.

## Próxima onda

Nenhum novo slot será selecionado até a `main` atual obter classificação runtime `VERDE`. A próxima
onda continuará exigindo exatamente cinco itens independentes, ownership sem sobreposição crítica e
baseline única comprovada.
