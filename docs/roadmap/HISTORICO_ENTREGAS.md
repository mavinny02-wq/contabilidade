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
| 2026-08-11 | v0.5.1 — primeira onda implementada | PRs `#14` a `#18` | cinco itens integrados; nova validação completa obrigatória |
| 2026-08-11 | v0.5.1 — exportação operacional | `EXP-CRT-001`, PR `#20` | Centro de Certidões ganhou CSV filtrável e protegido contra fórmula; runtime pendente |
| 2026-08-11 | v0.5.1 — manutenção de filiais | `EMP-FIL-001`, PR `#23` | edição/inativação individual com CNPJ imutável e sincronização de certidões; runtime pendente |
| 2026-08-11 | v0.5.1 — importação de empresas | `EMP-IMP-001`, PR `#25` | importação CSV com validação prévia, limites e resultado por linha; runtime pendente |
| 2026-08-11 | v0.5.1 — shutdown do worker | `AUT-SHD-001`, PR `#26` | drain da execução atual, timeout controlado e grace period do Compose; runtime pendente |
| 2026-08-11 | v0.5.1 — dashboard de certidões | `CRT-DASH-001`, PR `#27` | visão gerencial bounded por status/tipo e identificação de amostra parcial; runtime pendente |
| 2026-08-11 | v0.5.1 — exportação de auditoria | `AUD-EXP-001`, PR `#28` | filtros e CSV bounded sem detalhes JSON, com snapshot e proteção contra fórmula; runtime pendente |
| 2026-08-11 | v0.5.1 — reconciliação documental | `DOC-ORP-001`, PR `#29` | comparação read-only entre banco e storage, sem symlinks, paths ou correção automática; runtime pendente |
| 2026-08-11 | v0.5.1 — onda Empresas/Automação/Certidões/Auditoria/Documentos | PRs `#25` a `#29` | cinco slots integrados na `main` até `9fdfe8b`; gate runtime permanece aberto |
| 2026-08-11 | v0.5.1 — histórico cadastral | `EMP-HIS-001`, PR `#31` | Empresa 360 passou a exibir auditoria da empresa e das filiais sem detalhes JSON; runtime pendente |
| 2026-08-11 | v0.5.1 — certidões em lote | `CRT-BULK-001`, PR `#32` | até 500 acompanhamentos por lote, idempotência por item e resultado parcial; runtime pendente |
| 2026-08-11 | v0.5.1 — limites interativos | `AUT-LIM-001`, PR `#33` | limites de sessões e assinantes SSE com resposta 429 e capacidade no health; runtime pendente |
| 2026-08-11 | v0.5.1 — inventário de backups | `OPS-BKP-UI-001`, PR `#34` | listagem read-only e verificação SHA-256 dos conjuntos pela interface; runtime pendente |
| 2026-08-11 | v0.5.1 — prévia de retenção | `DOC-RET-001`, PR `#35` | simulação bounded por critérios, sem alteração no PostgreSQL ou storage; runtime pendente |
| 2026-08-11 | v0.5.1 — onda Histórico/Bulk/Limites/Backup/Retenção | PRs `#31` a `#35` | cinco slots integrados na `main` até `0e310ac`; gate runtime permanece aberto |
| 2026-08-11 | v0.5.1 — grupos e tags | `EMP-GRP-001`, PR `#37` | classificação interna, busca e migration V9, sem alterar cadastro fiscal; runtime pendente |
| 2026-08-11 | v0.5.1 — agenda de certidões | `CRT-CAL-001`, PR `#38` | agenda bounded por período/empresa com status autoritativo e nenhuma chamada fiscal; runtime pendente |
| 2026-08-11 | v0.5.1 — histórico de providers | `OBS-PRV-001`, PR `#39` | métricas de status, duração e custo por moeda sem payload ou segredo; runtime pendente |
| 2026-08-11 | v0.5.1 — configuração segura | `ADM-CFG-001`, PR `#40` | diagnóstico efetivo sem serializar tokens, segredos ou URLs completas; runtime pendente |
| 2026-08-11 | v0.5.1 — preview documental | `DOC-PRE-001`, PR `#41` | PDF/PNG/JPEG inline após validação de integridade e com headers restritivos; runtime pendente |
| 2026-08-11 | v0.5.1 — onda Grupos/Agenda/Providers/Configuração/Preview | PRs `#37` a `#41` | cinco slots integrados na `main` até `d7e50e5`; Flyway esperado V1–V9 e gate runtime aberto |
| 2026-08-11 | v0.5.1 — responsáveis por módulo | `EMP-RSP-001`, PR `#43` | contatos operacionais por área, migration V10 e auditoria sem PII; runtime pendente |
| 2026-08-11 | v0.5.1 — reconciliação de faturas | `CRT-FAT-001`, PR `#44` | fatura comparada com custo estimado por provider, competência e moeda; migration V11 e runtime pendente |
| 2026-08-11 | v0.5.1 — telemetria histórica | `AUT-TEL-001`, PR `#45` | heartbeats amostrados por tempo ou mudança de estado/versão; migration V12 e runtime pendente |
| 2026-08-11 | v0.5.1 — preflight de atualização | `OPS-UPD-001`, PR `#46` | manifesto validado sem download, execução, escrita, migration ou reinício; runtime pendente |
| 2026-08-11 | v0.5.1 — metadados documentais | `DOC-MET-001`, PR `#47` | correção de tipo/emissão/validade sem substituir arquivo ou alterar hash/MIME/storage; runtime pendente |
| 2026-08-11 | v0.5.1 — onda Responsáveis/Faturas/Telemetria/Update/Metadados | PRs `#43` a `#47` | cinco slots integrados na `main` até `8d7357b`; Flyway esperado V1–V12 e gate runtime aberto |
