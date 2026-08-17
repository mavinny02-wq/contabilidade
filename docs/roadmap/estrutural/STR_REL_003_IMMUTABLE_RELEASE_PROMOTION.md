# STR-REL-003 — manifesto imutável de promoção e rollback

**Status:** `RELEASED_FOR_EXECUTION`  
**Owner:** schema/guard/fixtures/workflow de release e promoção  
**Migration:** `NONE`

## Problema

A versão é governada e existe provenance estrutural, mas ainda falta um contrato único que vincule
release, SHA, imagens por digest, SBOMs, frontier Flyway, evidências e alvo de rollback. Sem ele, uma
promoção pode depender de tag mutável ou reconstrução no servidor.

## Objetivo

Criar tooling offline e determinístico para validar bundles de release, promoção entre ambientes e
rollback compatível. Esta task não publica imagens e não executa deploy.

## Escopo permitido

- `scripts/release/promotion/**`;
- schema, policy, fixtures e testes;
- workflow dedicado;
- resultado da task.

`VERSION`, POM, package manifests, Compose, Dockerfiles e workflows existentes são somente leitura.

## Bundle mínimo

```text
releaseVersion
gitCommit
createdAt normalizado
components[]
  name
  imageRepository
  imageDigest
  sbomSha256
  provenanceSha256
flywayFrontier
sourceEnvironment
targetEnvironment
evidenceIds[]
rollbackTarget
```

## Aceite

1. Toda imagem usa digest `sha256`; tag sem digest não autoriza promoção.
2. Versão e SHA devem ser coerentes com as autoridades do repositório.
3. Componentes obrigatórios: backend, frontend e automation worker.
4. SBOM e provenance possuem SHA-256 válido por componente.
5. O frontier Flyway é monotônico na promoção.
6. Rollback que exigiria voltar o schema abaixo do frontier aplicado é recusado.
7. Rebuild no servidor, artefato ausente, componente duplicado ou digest divergente falha.
8. Exceções exigem owner, motivo, transição e expiração.
9. Fixtures cobrem promoção válida, tag mutável, digest inválido, versão/SHA divergente, downgrade
   de schema, rollback seguro/inseguro e exceção expirada.
10. Saída JSON/Markdown é determinística e não contém credencial de registry.
11. Workflow dedicado valida o contrato sem publicar ou puxar imagens.

A prova real de registry, promoção e rollback permanece em `STR-REL-002` como campanha runtime.

`STR_REL_003_READY`
