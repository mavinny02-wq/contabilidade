# Roadmap do produto

## Checkpoint

- conteúdo candidato presente: `0.5.0` no branch fornecido `work`; equivalência com o último `main` ainda não comprovada;
- validação canônica: `docs/analise/ANALISE_COMPLETA_BASELINE_V050.md`;
- próximo gate serial: corrigir os dois blockers TypeScript, gerar lockfiles e comprovar builds/runtime local sem chamada fiscal;
- nenhuma próxima implementação deve ser selecionada antes da reconciliação desse gate.

## v0.5.0 — provider oficial Serpro Consulta CND

- modo API separado do browser;
- OAuth2 `client_credentials`;
- cache/renovação de token;
- CND e CPEND;
- continuação do status 7 somente em memória;
- PDF, datas e raiz do CNPJ validados;
- custo estimado por chamadas bilhetáveis;
- custo acumulado entre retries;
- acompanhamento Federal somente na matriz;
- provider desabilitado por padrão.

## Gate de integração

1. aplicar o ZIP incremental;
2. gerar lockfiles;
3. executar build real;
4. validar PostgreSQL/Flyway/Keycloak/Docker;
5. configurar contrato, secrets e custo;
6. executar preflight sem consulta;
7. executar uma consulta autorizada;
8. conferir PDF e faturamento;
9. reconciliar documentação e evidência.

## Candidatos futuros — não selecionados

- InfoSimples como provider comercial opcional;
- dashboard de custo e sucesso por provider;
- exportação gerencial de certidões;
- task dedicada de testes e concorrência;
- hardening de secrets e storage.
