# STR-DB-001 — lane PostgreSQL reproduzível com Testcontainers

## Objetivo

Eliminar a dependência de um PostgreSQL previamente instalado para a suíte do backend e executar o
contrato Flyway/JPA em PostgreSQL 17 descartável e reproduzível.

## Escopo executável

- adicionar dependências de teste Testcontainers/Spring Boot gerenciadas pelo BOM vigente, sem
  versão redundante;
- adaptar `BancoPostgresqlIntegracaoTest` para provisionar PostgreSQL 17 descartável;
- preservar override explícito apenas quando a campanha autorizar banco externo;
- validar schema vazio, Flyway V1–V12, ausência de falhas, estruturas recentes e `ddl-auto=validate`;
- comprovar idempotência em uma segunda inicialização contra o mesmo container;
- criar workflow dedicado que exija Docker e falhe caso o teste seja silenciosamente ignorado;
- manter logs curados sem senha, JDBC credential ou dados reais;
- limpar container e recursos temporários.

## Limites

- nenhuma migration SQL pode ser criada ou editada;
- não usar H2 ou banco em memória como substituto da prova PostgreSQL;
- não depender de banco, porta ou role preexistente na máquina;
- ausência de Docker fora da CI é `ENVIRONMENT_LIMITATION`;
- não chamar provider externo nem reutilizar dados locais.

## Aceite

- `mvn -B clean verify` passa em runner com Docker sem PostgreSQL pré-instalado;
- imagem PostgreSQL alvo e versão efetiva são registradas;
- teste falha se Flyway estiver incompleto, com checksum divergente ou estrutura obrigatória ausente;
- segunda inicialização não reaplica migrations;
- Testcontainers não vaza para runtime de produção;
- POM continua alinhado ao Spring Boot dependency management.
