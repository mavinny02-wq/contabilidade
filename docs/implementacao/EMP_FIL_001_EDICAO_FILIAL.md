# EMP-FIL-001 — Edição e inativação individual de filial

## Estado

`IMPLEMENTADO_AGUARDANDO_VALIDACAO_RUNTIME`

## Objetivo

Permitir que uma empresa mantenha os dados de cada filial sem alterar o estabelecimento matriz e sem
apagar histórico operacional ou fiscal.

## Resultado

Foi adicionado o endpoint:

```text
PUT /api/empresas/{empresaId}/filiais/{filialId}
```

A atualização permite alterar:

- situação cadastral;
- regime tributário;
- CNAE principal;
- inscrições estadual e municipal;
- endereço;
- UF e CEP;
- estado ativo/inativo da filial.

O CNPJ permanece imutável. Quando o estabelecimento precisa representar outro CNPJ, a orientação é
inativar o cadastro anterior e criar uma nova filial.

## Interface

Na Empresa 360, cada filial passa a possuir a ação `Editar`. O mesmo modal usado no cadastro é
reutilizado em modo de edição e apresenta:

- CNPJ somente leitura;
- situação ativa/inativa do cadastro;
- dados fiscais e endereço atuais;
- mensagens pt-BR de sucesso e erro.

O estabelecimento matriz continua sendo alterado somente pelo formulário principal da empresa.

## Consistência com certidões

A alteração da filial sincroniza os acompanhamentos de certidões sem exclusão física:

- filial inativa → acompanhamentos do estabelecimento ficam inativos;
- filial reativada → tipos aplicáveis voltam a ficar ativos;
- mudança de UF → certidões estaduais não aplicáveis são inativadas;
- mudança para São Paulo → acompanhamentos estaduais aplicáveis são criados ou reativados;
- criação de empresa/filial e ativação/inativação da empresa também passam pela mesma sincronização;
- resultado, documento e histórico anteriores são preservados.

A sincronização respeita simultaneamente o estado ativo da empresa, da filial, a UF e a regra
`TipoCertidao.aplicavel`.

## Auditoria

São registrados:

- `FILIAL_ATUALIZADA`;
- `FILIAL_ATIVADA`;
- `FILIAL_INATIVADA`.

A auditoria registra somente IDs, CNPJ e estado ativo; não inclui payload completo nem dados de
storage.

## Segurança e regras preservadas

- exige a permissão `EMPRESA_EDITAR`;
- filial precisa pertencer à empresa informada;
- matriz não pode ser atualizada pelo endpoint de filial;
- CNPJ não pode ser trocado;
- nenhum registro é apagado;
- nenhum provider externo é chamado;
- nenhuma migration foi necessária.

## Validações pendentes

- compilação Maven da `main` atual;
- i18n, typecheck e build do frontend;
- editar dados de uma filial;
- inativar e reativar uma filial;
- confirmar que uma filial de outro `empresaId` retorna não encontrado;
- confirmar rejeição da alteração do CNPJ;
- confirmar inativação/reativação dos acompanhamentos aplicáveis;
- confirmar que documentos e históricos antigos permanecem acessíveis.
