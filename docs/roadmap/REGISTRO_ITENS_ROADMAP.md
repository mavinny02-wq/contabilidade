# Registro de Itens do Roadmap

O registro é dono da identidade permanente e do status atual.

| ID | Tipo | Domínio | Status | Resumo |
|---|---|---|---|---|
| `EPICO-FND-001` | Épico | Fundação | INTEGRADO_V01 | Baseline on-premise |
| `HIST-FND-001` | História | Fundação | INTEGRADO_V01 | Backend, frontend, worker, infra e docs |
| `EPICO-COM-001` | Épico | Common | PACOTE_V020_PREPARADO | Common operacional |
| `HIST-COM-001` | História | Common | INTEGRADO_V01 | Keycloak/JWT/permissões |
| `HIST-COM-002` | História | Common | PACOTE_V020_PREPARADO | Documentos endurecidos |
| `HIST-COM-003` | História | Common | PACOTE_V020_PREPARADO | Fila, lease, retry e idempotência |
| `HIST-COM-004` | História | Common | PACOTE_V020_PREPARADO | Providers e políticas |
| `HIST-COM-005` | História | Common | PACOTE_V020_PREPARADO | Auditoria/notificações/erros |
| `HIST-COM-006` | História | Common | PACOTE_V020_PREPARADO | Intervenção e fallback |
| `EPICO-EMP-001` | Épico | Empresas | PACOTE_V020_PREPARADO | Empresas e estabelecimentos |
| `HIST-EMP-001` | História | Empresas | PACOTE_V020_PREPARADO | CRUD autoritativo |
| `HIST-EMP-002` | História | Empresas | PACOTE_V020_PREPARADO | Empresa 360 |
| `HIST-EMP-003` | História | Empresas | PACOTE_V020_PREPARADO | Filiais adicionais |
| `EPICO-AUT-001` | Épico | Automação | PARCIAL | Runtime Playwright |
| `HIST-AUT-001` | História | Automação | PACOTE_V020_PREPARADO | Worker com polling e leases |
| `HIST-AUT-002` | História | Automação | PACOTE_V020_PREPARADO | Intervenção backend/UI |
| `HIST-AUT-003` | História | Automação | PACOTE_V030_PREPARADO | Sessão interativa CDP/SSE com retomada confirmada |
| `EPICO-CRT-001` | Épico | Certidões | PACOTE_V020_PREPARADO | Centro de Certidões |
| `HIST-CRT-001` | História | Certidões | PACOTE_V020_PREPARADO | Domínio, UI e histórico |
| `HIST-CRT-002` | História | Certidões | PACOTE_V030_RUNTIME_PENDENTE | Portal Federal assistido |
| `HIST-CRT-003` | História | Certidões | PACOTE_V040_RUNTIME_PENDENTE | Portal SEFAZ-SP assistido |
| `HIST-CRT-004` | História | Certidões | PACOTE_V040_RUNTIME_PENDENTE | Portal PGE-SP assistido |
| `HIST-CRT-005` | História | Certidões | PACOTE_V020_PREPARADO | Política/fallback/custo |
| `HIST-CRT-006` | História | Certidões | PACOTE_V020_PREPARADO | Provider manual |
| `EPICO-ADM-001` | Épico | Administração | PACOTE_V020_PREPARADO | Operação e administração |
| `HIST-ADM-001` | História | Administração | INTEGRADO_V01 | Busca global |
| `HIST-ADM-002` | História | Administração | PACOTE_V020_PREPARADO | Providers e políticas |
| `HIST-ADM-003` | História | Administração | PACOTE_V020_PREPARADO | Console Técnica |
| `DEC-DEP-001` | Decisão | Implantação | APROVADA | on-premise first |
| `DEC-002` | Decisão | Execução | RESOLVIDA_V020 | PostgreSQL como fila inicial |
| `DEC-003` | Decisão | Segurança | PARCIAL | storage local e secrets por ambiente |
| `DEC-004` | Decisão | Infra | ABERTA | TLS e DNS internos |
| `AMB-001` | Ambiente | Git | RESOLVIDO | main remota |
| `AMB-002` | Ambiente | Dependências | CLOUD_AMARELO_RUNTIME_LOCAL_PENDENTE | lockfiles, frontend, worker e PDF sintético comprovados no Cloud; Maven no ambiente-alvo, Node suportado e Docker ainda pendentes |
| `HIST-VAL-001` | História | Validação | INTEGRADO_COM_PROVAS_PENDENTES | análise canônica, BAT artifact-only, startup sequencial e validações de schema integrados |
| `VAL-RUNTIME-V051-001` | Validação | Runtime | BLOQUEADO_POR_AMBIENTE | relatório histórico: runtime Windows/Docker, schemas, endpoints e UI não executados no Cloud |
| `VAL-CLOUD-V051-002` | Validação | Cloud | CLOUD_AMARELO | PR #12: frontend/worker, PDF sintético e análises estáticas verdes; Maven bloqueado por registry e runtime local fora do escopo Cloud |
| `GATE-VAL-001` | Gate | Validação | CLOUD_AMARELO_RUNTIME_LOCAL_PENDENTE | reprodutibilidade parcialmente comprovada; prova Docker/Windows ainda obrigatória antes da onda oficial |
| `SEC-AUT-001` | Segurança | Automação | CANDIDATO_BLOQUEADO_PELO_GATE | anti-replay de ticket da sessão interativa |
| `PERF-CRT-001` | Performance | Certidões | CANDIDATO_BLOQUEADO_PELO_GATE | limitar consultas globais do scheduler de certidões |
| `OPS-BKP-001` | Operação | Backup | CANDIDATO_BLOQUEADO_PELO_GATE | manifesto e verificação dos backups |
| `OBS-WRK-001` | Observabilidade | Worker | CANDIDATO_BLOQUEADO_PELO_GATE | heartbeat vencido/degradado na console técnica |
| `SEC-DOC-001` | Segurança | Documentos | CANDIDATO_BLOQUEADO_PELO_GATE | verificar integridade do arquivo antes do download |
| `AMB-003` | Ambiente | Serpro | ABERTO | contrato, credenciais, custo e runtime autorizado |
