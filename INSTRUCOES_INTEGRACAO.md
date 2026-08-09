# Como integrar este esqueleto ao repositório

O ZIP foi preparado para ser extraído na raiz de `C:\work\contabilidade`.

## 1. Preserve o estado atual

```powershell
Set-Location "C:\work\contabilidade"
git status
git pull --ff-only origin main
```

A árvore deve estar limpa antes de continuar.

## 2. Extraia o ZIP

Extraia todo o conteúdo do ZIP diretamente em:

```text
C:\work\contabilidade
```

Permita substituir os arquivos de bootstrap anteriores. O ZIP já contém versões reconciliadas de
`README.md`, `AGENTS.md`, `docs/` e `.contabilidade-orchestrator/`.

## 3. Valide no seu ambiente

```powershell
Set-Location "C:\work\contabilidade"
.\scripts\validar.ps1
```

O script compila e gera builds, mas não executa testes.

## 4. Faça o commit

```powershell
git status
git add .
git commit -m "feat: cria baseline on-premise e common inicial"
git push origin main
```

## 5. Inicie em modo local

```powershell
Copy-Item .env.example .env
.\scripts\iniciar-dev.ps1
```

Acesse `http://localhost:8088`.

## 6. Próximo passo

Depois do push, execute `prompts/PROMPT_01_RECONCILIAR_BASELINE.md` no Codex ou envie o commit para
reconciliação antes de criar a primeira onda de cinco slots.
