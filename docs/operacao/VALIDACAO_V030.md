# Validação da versão 0.3.0

**Classificação:** candidato de implementação com validação estática concluída e runtime autorizado pendente.
**Gerado em UTC:** 2026-08-09T12:52:51.113820+00:00

## Escopo validado

Esta validação cobre o provider Playwright do portal Federal RFB/PGFN, a sessão interativa para
CAPTCHA, a retomada na mesma página, o parser de PDF e as alterações de backend/frontend/infra.

## Validações executadas

| Verificação | Resultado |
|---|---|
| Bundle i18n `pt-BR` | OK — 42 arquivos e 86 entradas dinâmicas verificadas |
| Parse/transpile TypeScript | OK — 54 arquivos, 0 erros de sintaxe |
| Parse Java 21 | OK — 102 arquivos, 0 erros de sintaxe |
| JSON | OK — 12 arquivos |
| YAML | OK — 7 arquivos |
| XML | OK — 2 arquivos |
| Scripts shell | OK — `bash -n` |
| Imports relativos TypeScript | OK — nenhum módulo interno ausente |
| Imports internos Java | OK — nenhuma classe interna ausente |
| `git diff --check` contra v0.2.0 | OK |
| Integridade dos ZIPs | executada após empacotamento; resultado no arquivo de verificação |

## Validações não executadas neste ambiente

| Verificação | Motivo |
|---|---|
| `mvn -DskipTests clean compile` | Maven não está instalado no ambiente de geração |
| `npm install` / `npm run build` | registry npm do ambiente não disponibiliza os pacotes; lockfiles reais não foram inventados |
| `docker compose config/up` | Docker não está instalado no ambiente de geração |
| PostgreSQL/Flyway runtime | depende do Docker/PostgreSQL local do cliente |
| Keycloak/OIDC runtime | depende da stack local |
| Chromium/Playwright runtime | browser e imagem Docker não foram executados neste ambiente |
| Portal Federal real | exige execução autorizada com CNPJ permitido |
| CAPTCHA real | exige intervenção humana autorizada no portal atual |
| CND/CPEND reais | não foram fornecidas amostras autorizadas para prova do parser |
| Testes automatizados/E2E | permanecem em task de teste separada, conforme governança |

## Resultado

O código está **estruturalmente consistente**, mas o provider `FEDERAL_PORTAL` permanece desabilitado
por padrão. Ele só deve ser ativado após:

1. gerar os lockfiles reais;
2. obter compilação/build verde no ambiente local;
3. subir PostgreSQL, Keycloak, backend, frontend e worker;
4. executar `scripts/validar-portal-federal.ps1`;
5. realizar uma consulta autorizada;
6. confirmar screencast, CAPTCHA, retomada, PDF oficial, parser, upload e resultado normalizado.

## Limites de confiança

- o fluxo usa seletores semânticos e fallbacks, mas o DOM real pode mudar;
- a sessão interativa usa screencast CDP, não um desktop remoto completo;
- nenhuma página HTML impressa pelo browser é aceita como certidão oficial;
- somente bytes com assinatura `%PDF-` são enviados como documento;
- uma mudança de portal produz falha explícita e pode acionar fallback configurado;
- não houve tentativa de ocultar automação ou burlar CAPTCHA.
