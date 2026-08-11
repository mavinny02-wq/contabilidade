# DOC-ORP-001 — Reconciliação read-only do storage documental

## Objetivo

Detectar referências sem arquivo e arquivos sem registro de documento, sem excluir, mover ou alterar
evidências.

## Endpoint

```text
GET /api/console-tecnica/storage/reconciliacao
```

O endpoint exige `CONSOLE_TECNICA_LER`, executa a varredura sob demanda e grava o evento seguro
`STORAGE_RECONCILIADO`.

## Escopo da comparação

O banco considera todos os documentos, ativos e inativos. Isso impede que evidências preservadas de
registros inativados sejam classificadas incorretamente como órfãs.

A comparação verifica:

- referências do PostgreSQL sem arquivo correspondente;
- arquivos regulares sem qualquer documento correspondente;
- links simbólicos ignorados;
- limites atingidos ou leitura interrompida.

## Privacidade

A API e a auditoria não retornam nem registram caminhos de storage. As amostras exibidas são
fingerprints SHA-256 truncadas a 16 caracteres hexadecimais, suficientes para correlacionar uma
ocorrência com ferramentas administrativas sem revelar a estrutura de diretórios.

## Segurança

- nenhuma exclusão ou correção automática;
- nenhum symlink é seguido;
- a raiz não pode ser um link simbólico;
- arquivos não regulares são ignorados;
- comparação só é marcada como completa quando banco e filesystem terminam integralmente;
- quando qualquer lado é parcial, contagens de divergência não são apresentadas como conclusivas;
- nenhuma leitura do conteúdo dos documentos;
- nenhuma migration ou chamada externa.

## Configuração

```text
APP_STORAGE_RECONCILIATION_BATCH_SIZE=1000
APP_STORAGE_RECONCILIATION_MAX_REFERENCES=200000
APP_STORAGE_RECONCILIATION_MAX_FILES=200000
APP_STORAGE_RECONCILIATION_MAX_SAMPLES=20
```

Lotes aceitam de 10 a 5.000. Tetos de referências/arquivos aceitam até 1.000.000, e amostras até 100.

## Console Técnica

A interface mostra:

- status saudável, degradado ou indisponível;
- documentos registrados e ativos;
- referências e arquivos analisados;
- completude de cada varredura;
- divergências detectadas;
- links simbólicos ignorados;
- fingerprints de amostra;
- motivo seguro e horário da observação.

## Validação realizada

- revisão estática do cursor de referências;
- revisão da varredura sem seguir links;
- revisão dos estados completo/parcial;
- revisão da ausência de caminhos e conteúdo em resposta/auditoria;
- nenhuma operação destrutiva executada.

## Validação runtime pendente

- storage vazio e íntegro;
- referência sem arquivo;
- arquivo sem registro;
- documento inativo preservado;
- symlink ignorado;
- limites de referências e arquivos;
- diretório ausente/não legível;
- evento de auditoria sem path;
- nenhum arquivo alterado antes/depois da execução.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
