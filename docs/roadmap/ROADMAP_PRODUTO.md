# Roadmap do produto

## Checkpoint

A baseline v0.1 está no repositório. O pacote v0.2.0 foi preparado, mas só vira integrado depois de:

1. gerar lockfiles;
2. executar build real;
3. validar PostgreSQL/Flyway/Keycloak/Docker;
4. revisar diff;
5. commitar e enviar.

## v0.2.0

- Common operacional;
- Empresas/filiais;
- fila PostgreSQL;
- providers e políticas;
- intervenção;
- Centro de Certidões;
- provider manual;
- scheduler/alertas;
- worker pronto para fluxos futuros.

## Depois da integração

Próxima fase recomendada:

1. task de validação dedicada;
2. sessão assistida para intervenção;
3. análise do portal Federal;
4. análise do portal SEFAZ-SP;
5. análise do portal PGE-SP;
6. somente então conectores reais.

Não colocar análise e implementação do mesmo portal na mesma onda.
