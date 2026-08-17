# STR-CI-003 — runner local com paridade do Required CI

**Status:** `RETURNED_TO_BACKLOG_P0_HOLD`
**Wave anterior:** `CONTABILIDADE_FAST_LANE_WAVE_012` (`SUPERSEDED`)
**Baseline:** `main@3850443701279e2002c527b6eb376de8abd664cf`
**Migration:** `NONE`

## Problema

O workflow `Required CI / required-ci` existe, mas nenhuma execução remota é observável por causa de
settings/permissões externas. É necessário um runner local determinístico que execute o mesmo
contrato sem fingir que substitui um status check do GitHub.

## Escopo

Criar/alterar somente:

- runner, schema, policy, ledger e testes sob `scripts/ci/**`;
- fixtures sintéticas;
- `docs/implementacao/STR_CI_003_RESULT.md`.

`.github/workflows/required-ci.yml`, código de produto, manifests de dependência e demais workflows
são somente leitura.

## Contrato

O runner deve:

- extrair/validar as lanes obrigatórias do workflow atual;
- oferecer `plan`, `run` e `resume`;
- executar comandos sem `shell=true` e sem interpolação insegura;
- registrar início/fim, exit code, duração, classificação e fingerprint;
- parar ou continuar conforme policy explícita;
- suportar timeout por lane;
- produzir JSON e Markdown determinísticos;
- retomar somente lanes não concluídas quando baseline/policy permanecerem iguais.

Estados:

- `PASS`;
- `FAIL`;
- `ENVIRONMENT_LIMITATION`;
- `NOT_RUN`;
- `SKIPPED_BY_POLICY`;
- `STALE_LEDGER`.

## Regras obrigatórias

- lane obrigatória ausente ou renomeada sem policy: falha;
- `continue-on-error` indevido: falha;
- ferramenta ausente é limitação ambiental, não pass;
- ledger de outro SHA/policy não pode ser retomado;
- saída não contém env dump, token, command secret ou payload;
- resultado local nunca usa o nome/status de check remoto como se tivesse sido publicado.

## Validação

- fixtures de plan, pass, fail, timeout, ferramenta ausente, resume, stale ledger e redaction;
- comparação byte a byte de dois plans;
- validação de paridade com o workflow atual;
- exit codes determinísticos;
- `git diff --check`.

## Aceite

- nenhum comando remoto ou mutação GitHub;
- paridade demonstrável;
- classificações honestas;
- resultado lista o que ainda depende de Actions e branch protection.

`STR_CI_003_RELEASED`
