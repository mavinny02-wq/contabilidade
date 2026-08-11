# OPS-UPD-001 — Preflight de atualização controlada

## Objetivo

Validar um manifesto de atualização antes de qualquer download, substituição, execução ou alteração
de schema. A funcionalidade é deliberadamente read-only e não executa o update.

## Manifesto

Schema `1.0`:

```json
{
  "schemaVersion": "1.0",
  "targetVersion": "0.6.0",
  "minimumSourceVersion": "0.5.1",
  "createdAt": "2026-08-11T12:00:00Z",
  "artifacts": [
    {
      "component": "BACKEND",
      "fileName": "contabilidade-backend-0.6.0.jar",
      "sizeBytes": 12345678,
      "sha256": "64 caracteres hexadecimais"
    }
  ]
}
```

## Validações

- `schemaVersion = 1.0`;
- versões estritas `major.minor.patch`;
- destino superior à versão atual;
- versão atual compatível com a origem mínima;
- no máximo vinte artefatos;
- componentes `BACKEND`, `FRONTEND` e `WORKER` obrigatórios;
- ausência de `COMPOSE` gera aviso;
- nomes sem path, traversal ou caracteres inseguros;
- nomes únicos case-insensitive;
- tamanho positivo e limitado;
- SHA-256 com 64 caracteres hexadecimais;
- data ISO-8601 e aviso para relógio futuro.

## Endpoints

```text
GET  /api/console-tecnica/atualizacoes/modelo
POST /api/console-tecnica/atualizacoes/preflight
```

Ambos exigem `CONSOLE_TECNICA_LER`.

## Segurança

- o backend não baixa artefatos;
- o backend não lê arquivos mencionados no manifesto;
- nenhum hash é comparado com conteúdo nesta etapa;
- nenhum container, processo, migration ou script é executado;
- não há escrita no filesystem;
- a auditoria registra somente quantidade, presença da versão de destino e resultado aprovado;
- o manifesto possui limite configurável de tamanho.

## Configuração

```text
APP_UPDATE_PREFLIGHT_MAX_MANIFEST_SIZE_BYTES=1048576
```

## Provas runtime pendentes

- modelo e manifesto válido;
- schema, versão e origem incompatíveis;
- componente ausente, duplicidade, path traversal, tamanho e hash inválidos;
- arquivo vazio, grande, extensão/JSON inválidos;
- permissões;
- auditoria segura;
- i18n, typecheck e build do frontend.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
