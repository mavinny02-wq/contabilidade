# STR-REL-001 — Governança de versão e release

## Resultado

`IMPLEMENTADO_AGUARDANDO_INTEGRACAO`

O arquivo `VERSION` permanece como fonte canônica e não recebeu bump. O guard determinístico valida
a consistência da versão `0.5.1` com o projeto Maven, os manifests e lockfiles npm, o ambiente da
imagem no Compose, as tags on-premise derivadas de versão e o contrato de metadados de release.

O template de release exige que a materialização associe a versão canônica ao SHA do Git, às três
imagens versionadas, aos respectivos digests SHA-256 e ao procedimento de rollback. Ele não afirma
que imagens foram publicadas e preserva o uso artifact-only/on-premise previsto por `LOCK-DEP-001`.

## Owner e escopo preservado

- alterados somente guard, testes/fixtures, template de metadados, workflow dedicado e este resultado;
- nenhuma versão, dependência, migration, imagem ou configuração de runtime foi modificada;
- nenhuma chamada de rede, provider ou serviço pago é realizada pelo guard;
- `LOCK-EVID-001` é preservado por um check focado, rápido e reutilizável no pull request.

## Validações

- `python scripts/orchestration/validate-version-governance.py` — versão atual consistente;
- `python -m unittest scripts/orchestration/tests/test_validate_version_governance.py` — seis cenários,
  incluindo fixtures de drift em `VERSION`, Maven, npm, imagem e metadados de release;
- `git diff --check` — sem erros.

## Baseline e limitações

O checkout iniciou limpo em `1288ed9a5f081fec03f5d869db7c622f4cd38f81`, identificado localmente
como a ponta de `main` disponibilizada para a task. O ambiente não possui remoto Git configurado,
portanto a atualidade em relação ao GitHub não pôde ser atualizada ou comprovada (`ENVIRONMENT_LIMITATION`).

## Provas pendentes

A execução do workflow no GitHub e a materialização de metadados com SHA/digests reais pertencem à
integração e a uma release efetiva; não são alegadas por esta preparação.
