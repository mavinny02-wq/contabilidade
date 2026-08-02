# Fiscal Operations Platform integration catalog

**Classification:** `CANONICAL_ACTIVE`  
**Status:** `INITIAL_DISCOVERY`

| Family | Candidate source | Initial mode | Risk |
|---|---|---|---|
| Federal fiscal data | Serpro / Integra Contador | Official API | Medium |
| Federal fiscal status | SITFIS | Official asynchronous API | Medium |
| Federal certificates | Serpro CND | Official API | Low-medium |
| e-CAC mailbox | Integra Contador | Official API | Medium |
| DCTFWeb | Integra Contador | Read first; transmission later | High |
| PGDAS-D / DAS | Integra Contador | Read/generate first | Medium-high |
| Sicalc / DARF | Integra Contador | Official API | Medium |
| eSocial | Official webservices | XML/SOAP | High |
| NFS-e national | National standard | Official API where applicable | Medium |
| Municipal NFS-e | Municipality-specific | Connector by locality | Medium-high |
| FGTS Digital | Portal/eSocial-related | Assisted initially | High |
| CRF-FGTS | Public portal | Assisted/manual initially | High |
| CNDT | Public portal with anti-automation control | Manual/assisted | Very high |
| State certificates | State-specific | Discovery per state | High |
| Municipal certificates | Municipality-specific | Discovery per locality | High |

## Connector states

`DISABLED`, `CONFIGURATION_REQUIRED`, `READY`, `RUNNING`, `SUCCEEDED`, `PARTIAL`,
`RETRY_SCHEDULED`, `FAILED`, `AUTHORIZATION_REQUIRED`, `MANUAL_ACTION_REQUIRED`,
`SOURCE_UNAVAILABLE`.

## Rules

- Official documented API before browser automation.
- Never bypass CAPTCHA or anti-automation controls.
- Credentials/certificates use secret references, not plaintext domain columns.
- Raw responses are protected evidence, not public DTOs.
- Normalization is versioned.
- Retries are bounded and idempotent.
- Manual/assisted connectors are first-class auditable workflows.
