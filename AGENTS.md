# AGENTS.md

## Projeto
`Contabilidade` é uma plataforma interna fiscal/contábil. Mantenha alterações focadas.

## Idioma
- Documentação e UI: português do Brasil.
- Todo texto visível usa chave i18n; bundle inicial único `pt-BR`.
- Não hardcode textos em React.

## Arquitetura
- Backend Java/Spring Boot.
- Frontend React + TypeScript.
- PostgreSQL e Flyway.
- Keycloak/OAuth2/JWT.
- Autorização backend via Catálogo de Permissões.
- PostgreSQL é fonte de verdade.
- Workers Playwright separados do backend HTTP.
- Integrações por providers: API oficial, API comercial, portal automatizado, portal assistido e manual.

## Regras
- Backend calcula regras, estados, permissões e comandos.
- Falha de fonte externa nunca vira regularidade.
- Não usar alert/prompt/confirm do navegador.
- Segredos, certificados, tokens e documentos fiscais não aparecem em logs.
- Não burlar CAPTCHA; usar intervenção humana quando necessário.

## Orquestração
- Ondas oficiais: exatamente 5 slots independentes.
- Mesmo baseline e sem dependência entre slots.
- Propriedade de arquivos explícita.
- Reconciliação compartilhada serializada.
- Análise, implementação, bug, decisão, teste e reconciliação são tasks separadas.
- Testes só em task explicitamente de teste.
