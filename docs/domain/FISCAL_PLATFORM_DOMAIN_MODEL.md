# Fiscal Operations Platform domain model

**Classification:** `CANONICAL_ACTIVE`  
**Status:** `INITIAL_MODEL`

## Core identities

`Organization`, `LegalEntity`, `Company`, `Establishment`, `TaxRegistration`, `User`, `Role`.

## Operational model

`ObligationDefinition`, `ObligationOccurrence`, `OperationalTask`, `Assignment`, `Comment`,
`EvidenceReference`, `Notification`.

## Fiscal/compliance model

`FiscalCertificate`, `FiscalQuery`, `ExternalMessage`, `TaxGuide`, `PaymentEvidence`,
`FiscalDocument`, `ComplianceFinding`, `ComplianceRule`, `RiskAssessment`.

## Integration model

`ConnectorDefinition`, `ConnectorCredentialReference`, `ConnectorExecution`, `ExternalProtocol`,
`NormalizedResult`, `RetrySchedule`, `ManualAssistanceRequest`.

## Important separations

- An obligation definition is not an occurrence for a specific competence.
- An integration failure is not a fiscal irregularity.
- Current external data is not historical evidence.
- A document file is not its business classification or approval.
- A certificate status is not the same as issuing-portal availability.
- A task status is not the underlying fiscal state.
- A search document is never a source of truth.
