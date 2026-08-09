# Portal SEFAZ-SP — eCND de débitos não inscritos

**Operação:** `CERTIDAO_SP_SEFAZ_NAO_INSCRITOS`
**Provider:** `SEFAZ_SP_PORTAL`
**Status:** implementação preparada; runtime autorizado pendente.

## Fonte oficial

- Portal de emissão: `https://www10.fazenda.sp.gov.br/CertidaoNegativaDeb/Pages/EmissaoCertidaoNegativa.aspx`
- Guia: `https://portal.fazenda.sp.gov.br/servicos/certidoes/Paginas/Guia-N%C3%A3o-Inscritos.aspx`

O provider usa o CNPJ completo do estabelecimento. Ele respeita, por padrão, a janela informada pelo
portal — dias úteis, das 06:00 às 21:00, horário de Brasília. Feriados não são inferidos pelo código;
o próprio portal continua sendo autoridade para indisponibilidade.

## Fluxo implementado

1. abrir o eCND;
2. selecionar CNPJ quando a opção existir;
3. localizar e preencher o CNPJ semanticamente;
4. detectar CAPTCHA;
5. pausar em sessão interativa quando permitido;
6. emitir a certidão;
7. capturar exclusivamente bytes PDF;
8. validar emissor e CNPJ;
9. extrair resultado, número, emissão e validade quando presentes;
10. armazenar o documento e normalizar o resultado.

## Impedimentos

Se o portal indicar que a emissão eletrônica não foi possível por pendências/impedimentos, o provider
não inventa uma certidão positiva nem marca irregularidade sem documento. Ele encerra a tentativa de
portal como bloqueio funcional, permitindo fallback configurado ou procedimento manual/SIPET.

## Limites

- seletores e mensagens ainda precisam de validação no portal real;
- não há bypass de CAPTCHA;
- PDF sem dados suficientes é registrado como `INCOMPLETA`;
- provider permanece desabilitado até preflight e consulta autorizada.
