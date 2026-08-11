# EMP-RSP-001 — Responsáveis por módulo

## Objetivo

Permitir que cada empresa mantenha contatos operacionais distintos para Fiscal, Contábil,
Financeiro, Documentos, Automação e Administração sem misturar esses dados com o responsável geral
ou com o cadastro fiscal.

## Implementação

- migration `V10__empresa_responsaveis_modulo.sql`;
- um responsável por empresa e módulo;
- nome obrigatório, e-mail e telefone opcionais;
- ativação/inativação não destrutiva;
- endpoints:
  - `GET /api/empresas/{empresaId}/responsaveis-modulo`;
  - `PUT /api/empresas/{empresaId}/responsaveis-modulo/{modulo}`;
- página contextual acessível pela listagem de empresas;
- permissões existentes `EMPRESA_LER` e `EMPRESA_EDITAR`.

## Segurança e privacidade

- nenhuma chamada externa;
- nenhum dado fiscal é alterado;
- auditoria não grava nome, e-mail ou telefone;
- o evento registra apenas módulo, estado ativo e presença dos canais;
- empresa inexistente é tratada como recurso não encontrado;
- o par empresa/módulo é único no PostgreSQL.

## Módulos suportados

```text
FISCAL
CONTABIL
FINANCEIRO
DOCUMENTOS
AUTOMACAO
ADMINISTRACAO
```

## Provas runtime pendentes

- aplicação da V10 e validação de schema;
- criação e atualização dos seis módulos;
- unicidade por empresa/módulo;
- e-mail inválido e limites de tamanho;
- inativação e reativação;
- isolamento entre empresas;
- usuário apenas com leitura;
- auditoria sem PII dos contatos;
- i18n, typecheck e build do frontend.

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`
