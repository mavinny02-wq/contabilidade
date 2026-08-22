# Arquitetura base

## Forma

Monólito modular para domínio e APIs, com worker Playwright separado.

```text
Navegador
   ↓
Nginx / Frontend React
   ↓
Spring Boot modular
   ↓
PostgreSQL + storage de documentos
   ↓
Execuções/providers
   ↓
Worker Playwright ou API externa
```

## Autoridades

- PostgreSQL é a fonte de verdade.
- Flyway é o único mecanismo de schema.
- Backend decide autorização e estados.
- O worker não decide regularidade fiscal.
- Provider específico não vaza para a UI.
- Falha externa não produz estado fiscal verde/vermelho automaticamente.

## Implantação

A aplicação inicia on-premise, porém URL, storage, secrets e providers permanecem configuráveis para
permitir migração futura para nuvem.

O target de deploy é Docker/Compose e segue o mesmo padrão operacional de referência adotado no
PRIMA, adaptado aos componentes e às autoridades próprias do Contabilidade:

- um entrypoint oficial separa `doctor`, `check`, `build`, `start` e deploy on-premise;
- produção consome imagens previamente construídas e, quando exigido, fixadas por digest; o host de
  execução não compila Maven/npm nem executa `docker build`;
- dependências sobem em ordem explícita e cada transição depende de health/readiness real, nunca
  apenas da existência de um artefato dentro da imagem;
- comandos Docker passam pelo executor nativo central, preservam o contexto selecionado pelo
  operador e propagam stdout, stderr e exit code;
- o caminho normal não executa prune global, não remove volume PostgreSQL, storage documental ou
  backups e não troca contexto/builder global;
- reset é uma operação separada, explícita e escopada. Por padrão deve preservar dados; qualquer
  reset destrutivo futuro exigirá comando distinto, confirmação e inventário exato dos recursos;
- primeira e segunda inicialização, reutilização do PostgreSQL, ausência da probe temporária,
  health/readiness e falhas controladas produzem evidência redigida e pinada ao SHA.

Este é o contrato arquitetural alvo. A validação estrutural dos arquivos não comprova Docker
Desktop, Compose, readiness HTTP, persistência ou reset em runtime; essas provas pertencem ao gate
Windows/Docker autorizado.
