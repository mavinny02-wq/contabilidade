# AGENTS.md

## Projeto

`Contabilidade` é uma plataforma interna de operações fiscais e contábeis. Mantenha alterações
focadas, rastreáveis e compatíveis com implantação local.

## Idioma e i18n

- Documentação, interface e mensagens operacionais: português do Brasil.
- Todo texto visível do frontend deve usar chave i18n.
- O único bundle inicial é `pt-BR`.
- Chaves devem ser semânticas, por exemplo `menu.empresas` e `erros.fonteIndisponivel`.
- Não hardcode textos visíveis em JSX/TSX.
- Identificadores internos podem ser em português, mas não misture idiomas no mesmo domínio.

## Arquitetura

- Backend: Java 21 + Spring Boot.
- Frontend: React + TypeScript.
- Banco: PostgreSQL.
- Schema: Flyway exclusivamente.
- Autenticação: Keycloak/OAuth2/JWT.
- Autorização: Catálogo de Permissões no backend.
- Banco autoritativo: PostgreSQL.
- Documentos: abstração de storage; conteúdo fora do banco.
- Automação: worker Playwright separado do backend HTTP.
- Integrações: providers substituíveis.
- Implantação inicial: on-premise first, cloud-compatible.

## Regras de domínio

- Backend calcula regras, estados, permissões, prazos e disponibilidade de comandos.
- Frontend apresenta contratos prontos e não reconstrói regra fiscal.
- Falha de fonte externa não significa regularidade nem irregularidade fiscal.
- Execução técnica não é o mesmo que resultado de negócio.
- Busca e índices nunca são fonte de verdade.
- Registros rastreáveis devem ser arquivados/inativados em vez de apagados fisicamente.

## Segurança

- Segredos, certificados, tokens, documentos fiscais e dados pessoais são sensíveis.
- Nunca registrar segredo ou payload fiscal completo em logs.
- Autorizar antes de resolver ou baixar documentos.
- Não burlar CAPTCHA ou controles anti-automação.
- Intervenção humana deve ser auditada.
- Não executar ação fiscal autoritativa baseada apenas em IA.

## UI

- Não usar `alert`, `prompt` ou `confirm` do navegador.
- Usar diálogos e mensagens inline.
- Não criar dados fake em telas reais.
- Preservar acessibilidade e responsividade.
- Estados indisponíveis, desconhecidos e não consultados devem permanecer distintos.

## Orquestração

- Branch de integração inicial: `main`.
- Ondas oficiais têm exatamente cinco slots independentes.
- Todos os slots partem do mesmo baseline.
- Sem dependência entre slots da mesma onda.
- Propriedade de arquivos deve ser explícita e sem sobreposição crítica.
- Reconciliação compartilhada é serial.
- Análise, decisão, implementação, bug fix, teste e reconciliação são tasks separadas.
- Testes só são criados/executados em task explicitamente de teste.
- Em implementação, são permitidos compilação, build, validação de configuração/i18n e
  `git diff --check`.

## Dependências

Não introduza GPL-3, AGPL ou dependência de licença desconhecida. Registre a licença de toda
dependência nova ou atualizada.

## Saída esperada

Informe arquivos lidos, resultado, comportamento preservado, validações executadas, pendências,
arquivos alterados e estado Git final.
