# Roadmap do produto

## Checkpoint

- baseline integrada: `0.5.0`;
- relatório canônico: `docs/analise/ANALISE_COMPLETA_BASELINE_V050.md`;
- PR de validação identificou blockers de TypeScript, lockfiles ausentes e runtime não comprovado;
- esta entrega prepara as correções de `GATE-VAL-001` e melhora o BAT para localizar/instalar JDK 21;
- a próxima onda permanece condicionada à validação local verde.

## Gate imediato

1. copiar a candidata v0.5.1;
2. remover os quatro artefatos TypeScript rastreados;
3. gerar e revisar lockfiles com Node 22.12+;
4. executar `scripts/validar.ps1`;
5. executar `START_CONTABILIDADE.bat dev`;
6. confirmar Maven/JDK 21, builds, Compose, Flyway, Keycloak e health checks;
7. commitar a evidência;
8. reconciliar e promover os cinco previews.

## Onda candidata após gate verde

- anti-replay da sessão interativa;
- escalabilidade das consultas de certidões;
- backup verificável;
- observabilidade de heartbeat do worker;
- integridade de documentos no download.

Nenhum provider externo deve ser acionado durante o gate ou durante essas implementações.
