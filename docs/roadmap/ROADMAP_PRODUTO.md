# Roadmap do produto

## Baseline 0.1 — integração atual

- aplicação executável;
- on-premise local;
- Common inicial;
- empresas;
- documentos;
- providers;
- worker Playwright;
- intervenção humana;
- console técnica.

Após extrair o ZIP, compilar e subir no Git, reconciliar `HIST-FND-001` como integrado.

## Onda pós-baseline sugerida

A primeira onda deve ser planejada somente depois do build no ambiente do usuário. Candidatos:

1. endurecimento do modelo Empresas;
2. storage/backup operacional;
3. scheduler PostgreSQL e leasing;
4. sessão remota de intervenção humana;
5. UI de administração e observabilidade.

Não colocar tarefas dependentes na mesma onda.

## Vertical seguinte

Centro de Certidões:

1. modelo/estados;
2. documento de certidão;
3. provider Federal;
4. provider SEFAZ-SP;
5. provider PGE-SP;
6. política/fallback;
7. scheduler de renovação;
8. alertas e histórico.
