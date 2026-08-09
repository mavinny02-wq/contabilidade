# Changelog

## 0.2.0 — 2026-08-09

### Common

- fila PostgreSQL com aquisição atômica por `FOR UPDATE SKIP LOCKED`;
- lease renovável e recuperação atômica de leases expirados;
- idempotência com detecção de conflito de payload;
- retry com backoff;
- fallback entre providers;
- políticas por operação;
- provider pago com limite de custo;
- intervenção humana, expiração e retomada;
- worker Playwright com polling e heartbeat;
- upload de documentos pelo worker;
- validação de assinatura básica de arquivos;
- limpeza de arquivo quando a persistência imediata falha;
- auditoria e notificações ampliadas.

### Empresas

- domínio e APIs funcionais;
- estabelecimento matriz;
- filiais adicionais;
- Empresa 360;
- CNPJ, inscrições, regime e endereço.

### Certidões

- Centro de Certidões;
- Federal RFB/PGFN;
- SEFAZ-SP;
- PGE-SP;
- provider manual;
- estados fiscal/técnico separados;
- histórico;
- documentos;
- alertas;
- scheduler;
- políticas e fallback.

### Administração

- providers;
- políticas de aquisição;
- execuções;
- intervenções;
- auditoria;
- Console Técnica.

### Fora da versão

- fluxos reais de navegador;
- Serpro/InfoSimples reais;
- sessão remota para CAPTCHA;
- testes automatizados;
- runtime PostgreSQL/Docker validado neste ambiente de geração.

## 0.1.0 — 2026-08-09

- baseline on-premise;
- estrutura inicial backend, frontend e worker;
- documentação e orquestração.
