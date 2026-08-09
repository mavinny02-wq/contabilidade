# Validação da versão 0.4.0

**Data:** 2026-08-09
**Resultado:** validação estática aprovada; runtime oficial pendente.

## Escopo validado

| Verificação | Resultado |
|---|---|
| i18n pt-BR | OK — 42 fontes e 86 entradas dinâmicas |
| Worker TypeScript | OK — validação semântica com Node types e stubs dos módulos externos |
| Worker TypeScript, parse independente | OK |
| Frontend TypeScript, parse/transpile estático | OK |
| JSON | OK — 12 arquivos |
| YAML | OK — 7 arquivos |
| XML | OK — 2 arquivos |
| Java | OK — 102 fontes com estrutura léxica; enum alterado compilado isoladamente |
| Flyway | OK — sequência V1 a V6, sem duplicidade |
| Shell scripts | OK |
| Imports relativos TypeScript | OK |
| Alinhamento operação/provider | OK |
| i18n/intervenção SP | OK |
| `git diff --check` | OK |
| CAPTCHA externo/bypass | nenhum encontrado |

## Comportamentos revisados

- Federal, SEFAZ-SP e PGE-SP registrados no worker;
- SEFAZ-SP usa CNPJ completo;
- PGE-SP usa CNPJ base e somente acompanhamento da matriz;
- acompanhamentos PGE antigos de filiais são inativados, não excluídos;
- certidão inativa não aceita nova consulta nem resultado manual;
- providers estaduais continuam desabilitados;
- PDFs precisam começar por `%PDF-`;
- falha de emissão eletrônica não vira irregularidade fiscal sem documento conclusivo;
- sessão humana existente é reutilizada sem bypass de CAPTCHA.

## Não executado neste ambiente

- Maven/Spring Boot com dependências reais;
- `npm install` e builds com os pacotes efetivos;
- Docker Compose;
- PostgreSQL/Flyway em banco real;
- Keycloak;
- Chromium/Playwright real;
- consultas aos portais SEFAZ-SP e PGE-SP;
- CAPTCHA real;
- PDFs reais;
- testes unitários, integração, concorrência ou E2E.

A ativação dos providers depende de build local verde e prova autorizada por portal.
