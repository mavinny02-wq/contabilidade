# Correção npm do startup

O erro `Found: vite@undefined` não corresponde a um peer conflict real: a própria mensagem do npm
mostra que `@vitejs/plugin-react@5.2.0` aceita Vite 7. O problema ocorre quando o npm não resolve
corretamente os metadados de `vite@7.3.6` pelo registry/proxy/cache.

Esta correção:

- força `https://registry.npmjs.org/`;
- usa cache isolado em `.docker-local/artifact-build/npm-cache`;
- testa `npm ping`;
- tenta o proxy corporativo do ambiente PRIMA somente como fallback;
- valida `npm view vite@7.3.6 version`;
- remove `node_modules` parcial quando ainda não há lockfile;
- gera primeiro `package-lock.json`;
- usa `npm ci`;
- faz apenas uma tentativa transparente com `--legacy-peer-deps` se o resolver npm continuar
  retornando ERESOLVE apesar de os metadados estarem acessíveis.

Nenhum segredo é salvo no repositório. O proxy pode ser sobrescrito antes de executar:

```bat
set CONTABILIDADE_NPM_PROXY=http://host:porta
START_CONTABILIDADE.bat dev
```
