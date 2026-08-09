# Contabilidade

Plataforma interna de operações fiscais e contábeis, desenvolvida em português e preparada para
execução **on-premise first**, com portabilidade futura para nuvem.

## O que esta baseline entrega

- backend Java 21 + Spring Boot;
- frontend React + TypeScript;
- PostgreSQL + Flyway;
- autenticação preparada para Keycloak;
- Catálogo de Permissões aplicado no backend;
- i18n somente `pt-BR`, sem textos visíveis espalhados pelo frontend;
- cadastro funcional de empresas e estabelecimentos;
- upload, listagem e download de documentos;
- estruturas comuns de execuções, providers, intervenções, notificações e auditoria;
- busca global inicial por empresa/CNPJ;
- console técnica inicial;
- worker Playwright isolado, sem fluxos reais de portais;
- Docker Compose para desenvolvimento e implantação local;
- documentação, roadmap e orquestração no padrão adotado no PRIMA.

## Início rápido com Docker

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Abra:

- aplicação: `http://localhost:8088`;
- administração do Keycloak: `http://localhost:8088/auth/admin`.

O realm de desenvolvimento cria o usuário:

```text
admin@contabilidade.local
Admin123!
```

Esse usuário é **somente para desenvolvimento**. Para implantação real, use
`KEYCLOAK_REALM_FILE=realm-contabilidade.json`, altere todos os segredos e crie usuários próprios.

## Desenvolvimento sem Docker

O PostgreSQL precisa estar disponível.

```powershell
cd backend
mvn spring-boot:run
```

```powershell
cd frontend
npm install
npm run dev
```

```powershell
cd automation-worker
npm install
npm run dev
```

## Organização

```text
backend/             domínio e APIs
frontend/            aplicação web
automation-worker/   runtime isolado de automação de portais
infra/               Keycloak, PostgreSQL e proxy
scripts/             operação local/on-premise
docs/                documentação canônica
```

## Próximo vertical

A baseline não consulta Receita, SEFAZ-SP ou PGE-SP. Ela prepara o Common para que o
**Centro de Certidões** seja implementado como módulo independente, usando providers substituíveis:
API oficial, API comercial, portal automatizado, portal assistido ou processo manual.
