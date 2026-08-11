# Validação do frontend 0.5.1 no Codex Cloud

## Identificação

- Item: `VAL-CLOUD-FE-V051-001`.
- Executor: `CODEX_CLOUD_LINUX`.
- Versão lida de `VERSION`: `0.5.1`.
- Branch: `validation/cloud-frontend-v051`.
- SHA inicial: `d960da56991c4819564e3f1661ff95a4176a1b53`.
- SHA final do código validado: `a1c1ec5bf121f7fe338a9bb242aaa0dcb48c80cb`.
- Node.js preparado: `v24.15.0`.
- npm preparado: `11.4.2`.

O comando `contabilidade-maintenance` não estava instalado na imagem (`exit 127`). O perfil
`contabilidade-prepare frontend` concluiu a preparação, mas o processo chamador preservou um
Node.js anterior no `PATH`; por isso, todas as validações foram executadas explicitamente com
`/opt/node-v24.15.0-linux-x64/bin` no início do `PATH`. O repositório fornecido também não possuía
remote Git configurado, então não foi possível atualizar `main` por rede; o baseline disponível foi
preservado e identificado pelo SHA inicial acima.

## Harness permanente

O frontend não possuía comando de teste. Foram adicionados Vitest `3.2.4`, jsdom `26.1.0`, React
Testing Library `16.3.0`, `@testing-library/jest-dom` `6.6.3` e
`@testing-library/user-event` `14.6.1`, todos com versão exata e licença MIT. O lockfile foi gerado
com npm `11.4.2`. Os comandos permanentes são `npm test` e `npm run test:watch`.

Os 20 testes cobrem, sem chamadas de rede:

- defaults e sobreposições parciais da configuração de runtime, inclusive autenticação desligada;
- redirecionamento dos guardas de autenticação e permissão e passagem autorizada;
- resolução de chaves pt-BR usadas por páginas recentes;
- abertura, ausência quando fechado, botão de fechar e tecla Escape do modal;
- edição e normalização do payload de metadados de documentos no wrapper HTTP mockado;
- validação nativa de nome e e-mail do responsável por módulo, com o wrapper HTTP mockado;
- links de navegação adicionados nas ondas recentes.

Não há helper de exportação CSV/fórmula no frontend atual; portanto, essa cobertura não se aplica ao
baseline 0.5.1.

## Defeitos determinísticos corrigidos

1. Os campos `required` e `type="email"` dos responsáveis por módulo não pertenciam a um formulário,
   e o botão chamava diretamente a API. Cada cartão agora usa envio de formulário nativo, impedindo
   o envio de nome ausente ou e-mail inválido; há teste de regressão.
2. O contrato TypeScript de `window.__CONTABILIDADE_CONFIG__` exigia todas as propriedades, embora o
   carregamento de runtime combine defaults com substituições parciais. O tipo agora representa o
   comportamento real e há teste para uma configuração parcial.

## Resultado dos comandos

| Comando | Código | Resultado |
| --- | ---: | --- |
| `contabilidade-maintenance` | 127 | indisponível na imagem |
| `contabilidade-prepare frontend` | 0 | Node.js e dependências preparados |
| `npm ci --prefer-offline --no-audit --no-fund` | 0 | 232 pacotes instalados do lockfile |
| `npm run locale:validate` | 0 | 22 catálogos, 64 arquivos e 86 entradas dinâmicas válidos |
| `npm run typecheck` | 0 | TypeScript sem erros |
| `npm test` | 0 | 7 arquivos e 20 testes aprovados |
| `npm run build` | 0 | bundle Vite produzido |
| `test -f dist/index.html` | 0 | arquivo presente |
| `git diff --check` | 0 | sem erros de whitespace |

O build emitiu somente o aviso não bloqueante de chunk JavaScript acima de 500 kB. O bundle contém
`dist/index.html`, um CSS, um JavaScript e `config.js`. A inspeção de `config.js` encontrou apenas os
defaults públicos (`/api`, autenticação desligada e identificadores públicos do cliente), sem token,
senha, certificado, documento fiscal ou valor secreto do ambiente. Nenhum arquivo gerado novo
`.js`, `.d.ts`, `.map` ou `.tsbuildinfo` foi adicionado ao índice Git; o `.tsbuildinfo` legado foi
restaurado após as validações.

## Comportamento preservado e pendências

Foram preservados o bundle único pt-BR, as chaves i18n, as decisões de autorização do backend, o
modo local sem autenticação e todos os destinos de navegação existentes. Não houve acesso a portal,
provider ou backend real, nem uso de CNPJ, documento fiscal ou segredo em fixture e log.

Permanece como melhoria não bloqueante dividir o bundle principal. A indisponibilidade de
`contabilidade-maintenance` e a ausência de remote são limitações da imagem/repositório fornecido,
não falhas do gate do frontend.

## Classificação

**VERDE** para o gate reproduzível do frontend: instalação limpa, locale, typecheck, testes, build,
inspeção do bundle e `git diff --check` concluíram com sucesso.
