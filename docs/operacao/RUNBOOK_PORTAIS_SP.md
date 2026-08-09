# Runbook — Portais estaduais de São Paulo

## Preflight

```powershell
.\scripts\validar-portais-sp.ps1
```

Devem aparecer:

```text
SEFAZ_SP_PORTAL::CERTIDAO_SP_SEFAZ_NAO_INSCRITOS
PGE_SP_PORTAL::CERTIDAO_SP_PGE_DIVIDA_ATIVA
```

## Ativação controlada

1. manter `MANUAL` como contingência;
2. habilitar apenas um provider por vez;
3. usar CNPJ autorizado;
4. solicitar uma certidão individual;
5. acompanhar Execuções e Intervenções;
6. resolver somente o CAPTCHA;
7. confirmar PDF, CNPJ, emissão, validade e número;
8. desabilitar o provider se o portal divergir do fluxo esperado.

## SEFAZ-SP

- fora da janela configurada, a fonte é marcada como indisponível/retryable;
- se houver impedimento para emissão eletrônica, seguir fallback/manual;
- não registrar `IRREGULAR` sem documento oficial conclusivo.

## PGE-SP

- consultar o acompanhamento vinculado à matriz;
- o worker utiliza CNPJ base;
- se houver débitos e não houver PDF negativo, seguir procedimento manual aplicável;
- CPEN administrativa não é automatizada nesta versão.

## Evidência mínima

Registrar:

- executionId;
- portal/provider;
- CNPJ mascarado nos relatos;
- timestamps;
- quantidade de intervenções;
- código de erro ou resultado;
- hash e ID do documento;
- captura técnica somente quando aprovada e sem segredo.
