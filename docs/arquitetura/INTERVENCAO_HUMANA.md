# Intervenção humana

Casos: CAPTCHA, MFA, autenticação interativa, certificado local, confirmação excepcional ou mudança inesperada de página.

Fluxo: worker pausa → notifica operador → operador executa somente etapa necessária → continuar → worker reassume.

Auditar execução, empresa, portal, tipo, usuário, início, fim e resultado; nunca guardar segredo digitado.
