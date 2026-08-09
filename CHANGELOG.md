# Changelog

## 0.3.0 — 2026-08-09

### Automação Federal

- fluxo `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN` registrado no worker;
- navegação e preenchimento sem ocultação anti-bot;
- detecção de CAPTCHA e indisponibilidade;
- sessão interativa por CDP screencast e entrada remota;
- tickets HMAC temporários vinculados a usuário, intervenção, execução e sessão;
- retomada da execução na mesma página e sem incrementar tentativa;
- captura de bytes PDF por download, resposta HTTP, popup/blob e link de documento;
- rejeição de página HTML como substituto de documento oficial;
- validação de assinatura PDF;
- parser de CND, CPEND e certidão positiva;
- validação de CNPJ no documento;
- upload automático e resultado normalizado;
- provider mantido desabilitado até validação autorizada.

### Frontend

- modal de interação com o portal;
- mouse, rolagem, teclado e envio de texto;
- status de conexão e expiração;
- ação “Continuar automação” sem resolução manual paralela.

### Segurança

- proxy de sessão sem access log do ticket;
- ticket curto assinado com HMAC-SHA256;
- validação de atribuição do operador;
- nenhuma persistência de quadros do screencast;
- nenhum bypass de CAPTCHA.

### Pendências

- validação em runtime contra o portal Federal autorizado;
- amostras reais de CND e CPEND;
- testes automatizados, concorrência e E2E;
- providers SEFAZ-SP e PGE-SP.

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
