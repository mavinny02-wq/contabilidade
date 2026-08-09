# Automation Worker

Runtime isolado de Playwright.

Esta baseline inicia o browser, expõe health check e envia heartbeat ao backend, mas **não contém
fluxos reais de Receita, SEFAZ-SP ou PGE-SP**.

Novos fluxos devem implementar `FluxoPortal` e ser registrados explicitamente. Detecção de CAPTCHA,
MFA ou autenticação interativa deve resultar em intervenção humana, nunca em bypass.
