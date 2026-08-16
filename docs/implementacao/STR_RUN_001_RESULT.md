# STR-RUN-001 — Coletor de evidências do Windows

## Resultado

Implementado um coletor independente para registrar, em JSON, a situação das ferramentas usadas
no ambiente Windows. A coleta diferencia ferramenta disponível, indisponível e execução com erro,
sem converter indisponibilidade técnica em diagnóstico de negócio.

O artefato contém versões do PowerShell, Git, Docker Compose e estado do WSL, além da revisão e do
estado do repositório. O nome da máquina é persistido somente como SHA-256 e as variáveis de
ambiente permitidas são representadas apenas por indicadores de presença.

## Contrato e segurança

- O schema `1.0.0` é fechado a propriedades não declaradas e versiona o formato do artefato.
- Saídas de comandos passam por redação de credenciais em URL, bearer tokens, segredos nomeados,
  chaves privadas e certificados.
- O arquivo é gravado em UTF-8 sem BOM; o diretório de destino é criado quando necessário.
- Códigos de saída: `0` para sucesso, `2` para argumentos inválidos, `3` para falha de gravação e
  `4` para falha de coleta.
- A ausência de Git, Docker ou WSL é registrada como `indisponivel` e não impede a produção das
  demais evidências.

## Uso

```powershell
.\scripts\orchestration\collect-windows-evidence.ps1 `
  -OutputPath .\evidencias\ambiente-windows.json
```

## Escopo preservado

Não houve alteração em startup, deploy, banco de dados, aplicação, autenticação ou regras fiscais.
Nenhuma dependência de produção foi adicionada e nenhuma migração é necessária.

## Validações

- parsing dos arquivos PowerShell;
- testes Pester de redação, privacidade, gravação e códigos de saída;
- fixtures válida e inválida do schema JSON;
- verificação de whitespace do Git.

## Pendências

Os arquivos `scripts/AGENTS.md`, `scripts/orchestration/AGENTS.md` e
`docs/roadmap/estrutural/STR_RUN_001_WINDOWS_EVIDENCE_COLLECTOR.md` indicados na task não estavam
presentes no baseline fornecido. A implementação seguiu o `AGENTS.md` da raiz e os contratos
explícitos da task.
