# Histórico de Entregas

Registrar aqui resultados integrados e pacotes candidatos de forma explícita.

| Data | Baseline | IDs | Resultado |
|---|---|---|---|
| 2026-08-09 | documentação inicial | docs | governança e roadmap |
| 2026-08-09 | v0.1.0 | Fundação | baseline integrada |
| 2026-08-09 | v0.2.0 | Common/Empresas/Certidões | código incorporado; provas runtime ainda abertas |
| 2026-08-09 | v0.3.0 | Federal portal/sessão | código incorporado; runtime oficial pendente |
| 2026-08-09 | v0.4.0 | SEFAZ-SP/PGE-SP | integrado na `main`; runtime oficial pendente |
| 2026-08-09 | pacote v0.5.0 | `HIST-CRT-007`, `HIST-AUT-004`, `HIST-COM-007` | provider Serpro preparado; integração e runtime pendentes |
| 2026-08-09 | conteúdo v0.5.0 no branch fornecido | `HIST-VAL-001` | relatório canônico e BAT incorporados; build frontend/worker reprovado; Docker/runtime pendentes |
| 2026-08-10 | v0.5.1 — endurecimento de runtime | PRs `#2` a `#8` | bootstrap PostgreSQL, startup sequencial, migrations V6/V7, PDF.js e validação de schemas integrados; prova local completa ainda pendente |
| 2026-08-11 | v0.5.1 — validação Codex Cloud inicial | `VAL-RUNTIME-V051-001`, PR `#9` | lockfiles usados; frontend e worker verdes no runner; tipagem PDF.js corrigida; Maven e runtime Windows/Docker bloqueados pelo ambiente |
| 2026-08-11 | v0.5.1 — validação Cloud completa | `VAL-CLOUD-V051-002`, PR `#12` | PDF sintético, frontend, worker e análises estáticas verdes; evidência Windows indevida corrigida; Maven bloqueado pelo registry e runtime local ainda pendente |
| 2026-08-11 | v0.5.1 — segurança da sessão interativa | `SEC-AUT-001`, PR `#14` | anti-replay implementado com consumo único de jti, migration V8 e grant HttpOnly; validação runtime local pendente |
| 2026-08-11 | v0.5.1 — scheduler bounded | `PERF-CRT-001`, PR `#15` | inicialização, agendamento e alertas limitados por lote com cursores rotativos; build/runtime pendentes |
| 2026-08-11 | v0.5.1 — backup verificável | `OPS-BKP-001`, PR `#16` | manifesto com tamanho/SHA-256 e verificadores PowerShell/shell integrados; backup real e PowerShell pendentes |
| 2026-08-11 | v0.5.1 — heartbeat do worker | `OBS-WRK-001`, PR `#17` | Console Técnica passou a classificar heartbeat saudável, atrasado, expirado e ausente; runtime pendente |
| 2026-08-11 | v0.5.1 — integridade documental | `SEC-DOC-001`, PR `#18` | download recalcula tamanho/SHA-256, bloqueia divergência e audita em transação isolada; runtime pendente |
| 2026-08-11 | v0.5.1 — onda implementada | PRs `#14` a `#18` | cinco itens integrados na main `b50fd182`; nova validação completa obrigatória antes da próxima onda |
| 2026-08-11 | v0.5.1 — reconciliação da onda | PR `#19` | docs, status e prompts arquivados; gate mantido aberto e próxima onda não selecionada |
| 2026-08-11 | v0.5.1 — exportação operacional | `EXP-CRT-001`, PR `#20` | Centro de Certidões ganhou CSV filtrável, bounded, auditado e protegido contra fórmula; runtime pendente |
| 2026-08-11 | v0.5.1 — manutenção de filiais | `EMP-FIL-001`, PR `#23` | Empresa 360 ganhou edição e inativação individual de filial com CNPJ imutável e sincronização não destrutiva das certidões; runtime pendente |
