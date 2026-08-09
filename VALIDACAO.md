# Validação da baseline 0.1

Gerado em UTC: 2026-08-09T04:17:14.998068+00:00

Nenhum teste automatizado foi criado ou executado. Esta validação cobre apenas compilação, builds, i18n e estrutura do Compose.

| Verificação | Código | Resultado |
|---|---:|---|
| Backend — mvn -DskipTests clean compile | 127 | NÃO EXECUTADO — ferramenta ausente |
| Frontend — npm ci | 1 | FALHOU |
| Frontend — validação pt-BR | 1 | FALHOU |
| Frontend — build TypeScript/Vite | 1 | FALHOU |
| Worker — npm ci | 1 | FALHOU |
| Worker — build TypeScript | 2 | FALHOU |
| Docker Compose — config | 127 | NÃO EXECUTADO — ferramenta ausente |

**Resultado obrigatório:** COM PENDÊNCIAS.

## Log — Frontend — npm ci

```text
Running frontend-install
npm error code EUSAGE
npm error
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm error later to generate a package-lock.json file, then try again.
npm error
npm error Clean install a project
npm error
npm error Usage:
npm error npm ci
npm error
npm error Options:
npm error [--install-strategy <hoisted|nested|shallow|linked>] [--legacy-bundling]
npm error [--global-style] [--omit <dev|optional|peer> [--omit <dev|optional|peer> ...]]
npm error [--include <prod|dev|optional|peer> [--include <prod|dev|optional|peer> ...]]
npm error [--strict-peer-deps] [--foreground-scripts] [--ignore-scripts] [--no-audit]
npm error [--no-bin-links] [--no-fund] [--dry-run]
npm error [-w|--workspace <workspace-name> [-w|--workspace <workspace-name> ...]]
npm error [-ws|--workspaces] [--include-workspace-root] [--install-links]
npm error
npm error aliases: clean-install, ic, install-clean, isntall-clean
npm error
npm error Run "npm help ci" for more info
npm error A complete log of this run can be found in: /home/oai/.npm/_logs/2026-08-09T04_17_12_894Z-debug-0.log
```

## Log — Frontend — validação pt-BR

```text
Running frontend-locale

> contabilidade-frontend@0.1.0 locale:validate
> node scripts/validate-locale.mjs

Chaves i18n ausentes:
- documentos.tipos.${value}
- empresas.abas.${item}
- empresas.regimes.${empresa.regimeTributario}
- empresas.regimes.${matriz.regimeTributario}
- empresas.regimes.${regime}
- empresas.status.${empresa.status}
- empresas.status.${matriz.status}
- empresas.status.${status}
- execucoes.status.${execucao.status}
- integracoes.tipos.${provedor.tipo}
- intervencoes.tipos.${item.tipo}
- notificacoes.tipos.${notificacao.tipo}
```

## Log — Frontend — build TypeScript/Vite

```text
es/ExecucoesPage.tsx(55,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/ExecucoesPage.tsx(57,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/ExecucoesPage.tsx(58,13): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/ExecucoesPage.tsx(59,11): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/ExecucoesPage.tsx(60,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(1,50): error TS2307: Cannot find module 'react' or its corresponding type declarations.
src/pages/IntegracoesPage.tsx(2,32): error TS2307: Cannot find module 'react-i18next' or its corresponding type declarations.
src/pages/IntegracoesPage.tsx(30,20): error TS7006: Parameter 'atuais' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(31,19): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(48,22): error TS7006: Parameter 'atuais' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(48,45): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(56,5): error TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
src/pages/IntegracoesPage.tsx(63,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(64,28): error TS7006: Parameter 'provedor' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(65,19): error TS2322: Type '{ children: any[]; key: any; }' is not assignable to type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
  Property 'key' does not exist on type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
src/pages/IntegracoesPage.tsx(66,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(67,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(67,40): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(71,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(72,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(72,77): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(73,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(74,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(75,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(79,32): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(81,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(81,54): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(82,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(83,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(84,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(84,54): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(85,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(85,153): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(86,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(87,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(88,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(88,51): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(89,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(89,158): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(90,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(91,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(92,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(92,51): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(93,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(93,151): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(94,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(95,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(96,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(96,51): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(97,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(97,123): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(98,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(99,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(100,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(100,61): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(101,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(101,133): error TS7006: Parameter 'event' implicitly has an 'any' type.
src/pages/IntegracoesPage.tsx(102,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(103,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(105,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(105,121): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntegracoesPage.tsx(109,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(1,50): error TS2307: Cannot find module 'react' or its corresponding type declarations.
src/pages/IntervencoesPage.tsx(2,32): error TS2307: Cannot find module 'react-i18next' or its corresponding type declarations.
src/pages/IntervencoesPage.tsx(42,5): error TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
src/pages/IntervencoesPage.tsx(49,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(50,23): error TS7006: Parameter 'item' implicitly has an 'any' type.
src/pages/IntervencoesPage.tsx(51,19): error TS2322: Type '{ children: any; key: any; }' is not assignable to type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
  Property 'key' does not exist on type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
src/pages/IntervencoesPage.tsx(52,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(53,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(54,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(55,21): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(55,55): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(57,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(58,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(58,51): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(59,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(59,55): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(60,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(64,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/IntervencoesPage.tsx(67,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(1,50): error TS2307: Cannot find module 'react' or its corresponding type declarations.
src/pages/NotificacoesPage.tsx(2,32): error TS2307: Cannot find module 'react-i18next' or its corresponding type declarations.
src/pages/NotificacoesPage.tsx(3,22): error TS2307: Cannot find module 'react-router-dom' or its corresponding type declarations.
src/pages/NotificacoesPage.tsx(38,5): error TS2875: This JSX tag requires the module path 'react/jsx-runtime' to exist, but none could be found. Make sure you have types for the appropriate package installed.
src/pages/NotificacoesPage.tsx(44,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(45,30): error TS7006: Parameter 'notificacao' implicitly has an 'any' type.
src/pages/NotificacoesPage.tsx(46,19): error TS2322: Type '{ children: any; key: any; className: string; }' is not assignable to type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
  Property 'key' does not exist on type '{ children: ReactNode; className?: string | undefined; titulo?: string | undefined; }'.
src/pages/NotificacoesPage.tsx(47,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(48,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(49,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(50,21): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(50,62): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(52,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(53,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(53,57): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(54,19): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(54,62): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(55,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(56,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(63,17): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(64,15): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
src/pages/NotificacoesPage.tsx(67,9): error TS7026: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
tsconfig.node.json(7,35): error TS5096: Option 'allowImportingTsExtensions' can only be used when either 'noEmit' or 'emitDeclarationOnly' is set.
```

## Log — Worker — npm ci

```text
Running worker-install
npm error code EUSAGE
npm error
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm error later to generate a package-lock.json file, then try again.
npm error
npm error Clean install a project
npm error
npm error Usage:
npm error npm ci
npm error
npm error Options:
npm error [--install-strategy <hoisted|nested|shallow|linked>] [--legacy-bundling]
npm error [--global-style] [--omit <dev|optional|peer> [--omit <dev|optional|peer> ...]]
npm error [--include <prod|dev|optional|peer> [--include <prod|dev|optional|peer> ...]]
npm error [--strict-peer-deps] [--foreground-scripts] [--ignore-scripts] [--no-audit]
npm error [--no-bin-links] [--no-fund] [--dry-run]
npm error [-w|--workspace <workspace-name> [-w|--workspace <workspace-name> ...]]
npm error [-ws|--workspaces] [--include-workspace-root] [--install-links]
npm error
npm error aliases: clean-install, ic, install-clean, isntall-clean
npm error
npm error Run "npm help ci" for more info
npm error A complete log of this run can be found in: /home/oai/.npm/_logs/2026-08-09T04_17_13_873Z-debug-0.log
```

## Log — Worker — build TypeScript

```text
Running worker-build

> contabilidade-automation-worker@0.1.0 build
> tsc -p tsconfig.json

error TS2688: Cannot find type definition file for 'node'.
  The file is in the program because:
    Entry point of type library 'node' specified in compilerOptions
```

