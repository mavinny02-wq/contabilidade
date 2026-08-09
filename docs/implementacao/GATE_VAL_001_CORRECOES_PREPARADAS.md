# GATE-VAL-001 — correções de reprodutibilidade preparadas

**Status:** `CORRECAO_PREPARADA_VALIDACAO_LOCAL`  
**Baseline:** `main` v0.5.0  
**Escopo:** BAT, blockers TypeScript, lockfiles e higiene do repositório

## Evidência de origem

A análise canônica da v0.5.0 confirmou:

- frontend bloqueado pelo narrowing de `ApiError | Error`;
- worker bloqueado por chamada incompatível a `PDFDocumentProxy.destroy()`;
- ausência de `package-lock.json` nos dois projetos Node;
- BAT dependente do Java que já estivesse ativo no `JAVA_HOME/PATH`;
- artefatos TypeScript gerados rastreados no Git.

## Correções desta entrega

- `START_CONTABILIDADE.bat` localiza um JDK 21 completo sem remover Java 17;
- quando não encontra JDK 21, o modo interativo oferece instalação do Temurin 21 via WinGet;
- o BAT confirma que o Maven está realmente usando Java 21;
- o BAT localiza Node 22.12+ e pode oferecer instalação do Node LTS via WinGet;
- no modo `dev`, lockfiles ausentes podem ser gerados apenas após confirmação explícita;
- no modo `onpremise`, lockfiles ausentes continuam bloqueando a inicialização;
- frontend faz narrowing seguro do erro da sessão interativa;
- parsers PDF encerram o `PDFDocumentLoadingTask`, compatível com os tipos de `pdfjs-dist`;
- script de lockfiles exige Node 22.12+ e valida `lockfileVersion >= 3`;
- `.gitignore` passa a excluir `.tsbuildinfo`, saídas compiladas do Vite config e `.docker-local`.

## Exclusões manuais necessárias

Os arquivos gerados já rastreados não são removidos automaticamente pelo ZIP. Excluir uma vez:

```powershell
Remove-Item ".\frontend\tsconfig.app.tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item ".\frontend\tsconfig.node.tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item ".\frontend\vite.config.js" -Force -ErrorAction SilentlyContinue
Remove-Item ".\frontend\vite.config.d.ts" -Force -ErrorAction SilentlyContinue
```

## Validação ainda obrigatória no Windows

```powershell
.\scripts\gerar-lockfiles.ps1
.\scripts\validar.ps1
.\START_CONTABILIDADE.bat dev
```

O gate só pode ser encerrado após:

- JDK 21 detectado;
- Maven usando JDK 21;
- Node 22.12+;
- lockfiles versionados;
- `npm ci`, typecheck e builds verdes;
- Maven compile/package verde;
- Compose/Flyway/Keycloak e cinco health checks verdes;
- nenhuma chamada fiscal externa durante a validação.
