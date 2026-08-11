# Roadmap do produto

## Checkpoint

- versão declarada: `0.5.1`;
- commit final da onda mais recente: `8d7357bf70a77bf6e265f4c50aed6453510a93d3`;
- PRs da onda mais recente: `#43` a `#47`;
- schema atual esperado: Flyway V1–V12;
- validação Cloud canônica é histórica para uma baseline anterior;
- classificação atual: `MULTIPLAS_ONDAS_IMPLEMENTADAS_RUNTIME_LOCAL_PENDENTE`;
- executor da prova runtime: `LOCAL_WINDOWS_MANUAL`;
- próxima onda: não selecionada.

## Onda mais recente

A autorização direta do usuário produziu cinco slots independentes:

1. `EMP-RSP-001` — responsáveis por módulo da empresa;
2. `CRT-FAT-001` — reconciliação de faturas dos providers;
3. `AUT-TEL-001` — histórico amostrado de heartbeats;
4. `OPS-UPD-001` — preflight de atualização controlada;
5. `DOC-MET-001` — edição segura de metadados documentais.

Os cinco itens foram integrados pelas PRs `#43` a `#47` e permanecem
`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`.

## Capacidades preparadas

### Empresas

- responsáveis distintos para Fiscal, Contábil, Financeiro, Documentos, Automação e Administração;
- um contato por empresa e módulo;
- nome obrigatório, e-mail e telefone opcionais;
- ativação e inativação sem exclusão;
- auditoria que não copia PII do contato;
- migration V10 e nova página contextual.

### Certidões e providers

- registro de fatura por provider, competência e moeda;
- comparação com a soma dos custos estimados das execuções do mesmo recorte;
- classificação sem divergência, acima ou abaixo do estimado;
- tolerância operacional de 0,01;
- atualização idempotente da mesma competência;
- migration V11;
- nenhuma chamada externa durante a reconciliação.

### Automação e observabilidade

- histórico de heartbeat persistido por amostragem;
- nova amostra na primeira observação, mudança de status/versão ou após intervalo;
- horário autoritativo do backend;
- período, filtro de worker, contagens e flag parcial;
- migration V12;
- nenhuma empresa, execução, sessão, ticket ou payload no histórico.

### Atualização controlada

- download de modelo de manifesto;
- preflight de schema, versões, origem mínima e artefatos;
- validação de componentes, nomes, duplicidades, tamanhos e formato SHA-256;
- resultado aprovado/reprovado com erros e avisos;
- nenhuma transferência, execução, escrita, migration ou reinício pela funcionalidade.

### Documentos

- tipo, data de emissão e validade podem ser corrigidos após o upload;
- validade não pode anteceder a emissão;
- empresa, nome, MIME, tamanho, SHA-256, origem, storage, conteúdo e estado permanecem imutáveis;
- auditoria registra somente quais grupos de metadados mudaram;
- preview, download e retenção continuam usando a mesma evidência física.

## Itens anteriores

Continuam integrados e aguardando prova runtime todos os itens das PRs funcionais `#14` a `#41`.
Nenhum provider fiscal foi acionado durante qualquer implementação.

## Gate imediato — execução humana local

1. atualizar a `main`;
2. executar Maven Java 21;
3. executar frontend e worker com Node suportado;
4. validar Compose `dev` e `onpremise`;
5. executar `START_CONTABILIDADE.bat dev`;
6. comprovar imagens artifact-only e serviços saudáveis;
7. validar Keycloak/Liquibase e Flyway V1–V12;
8. executar endpoints e smoke UI;
9. executar as provas focadas de todos os itens pendentes;
10. anexar a evidência ao relatório runtime;
11. executar uma task Cloud somente para reconciliar o commit de evidência.

A evidência Cloud da PR `#12` não substitui essa prova, pois a `main` foi amplamente modificada depois.

## Próxima onda

Nenhum novo slot será selecionado até a `main` atual obter classificação runtime `VERDE`. A próxima
onda continuará exigindo exatamente cinco itens independentes, ownership sem sobreposição crítica e
baseline única comprovada.
