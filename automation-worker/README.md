# Automation Worker

Worker isolado para integrações externas.

## Modos

- `API`: executa sem abrir Chromium;
- `PORTAL`: usa Playwright e pode abrir sessão interativa humana.

## Fluxos registrados

- `SERPRO::CERTIDAO_FEDERAL_RFB_PGFN` — API oficial;
- `FEDERAL_PORTAL::CERTIDAO_FEDERAL_RFB_PGFN` — portal assistido;
- `SEFAZ_SP_PORTAL::CERTIDAO_SP_SEFAZ_NAO_INSCRITOS` — portal assistido;
- `PGE_SP_PORTAL::CERTIDAO_SP_PGE_DIVIDA_ATIVA` — portal assistido.

O health check publica capacidades e diagnósticos sem expor credenciais.

CAPTCHA, MFA e autenticação interativa sempre geram intervenção humana. Nenhum fluxo implementa
bypass ou serviço externo de resolução de CAPTCHA.
