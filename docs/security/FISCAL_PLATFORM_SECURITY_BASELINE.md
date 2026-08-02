# Fiscal Operations Platform security baseline

**Classification:** `CANONICAL_ACTIVE`  
**Status:** `INITIAL_BASELINE`

## Sensitive assets

- certificate files/private keys and passwords;
- OAuth client credentials and tokens;
- powers of attorney;
- fiscal messages/documents;
- personal data;
- payment/banking evidence;
- external raw payloads.

## Controls

- Keycloak authentication and backend Permission Catalog authorization.
- Authorization before entity/document resolution.
- Secret references through approved secret storage.
- Encryption in transit and at rest.
- Structured redaction before logging.
- Audit of sensitive reads, downloads and commands.
- Object-level checks for CNPJ/company access.
- Correlation IDs without private payloads.
- No frontend-only authorization.
- No automatic fiscal action solely from an AI answer.
- No CAPTCHA bypass or hidden portal automation.

## Certificate rule

Server automation should prefer safely managed certificate forms approved by the company.
A3/token/cloud-certificate behavior requires an explicit integration decision and cannot be assumed.
