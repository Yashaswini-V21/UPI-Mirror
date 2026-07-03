# ADR-002: Zero-Knowledge Privacy Model

## Status
Accepted

## Context
Kira-AI processes sensitive financial data — bank statements containing account numbers, UPI IDs, merchant names, transaction amounts, and personal identifiers. Users must trust the system with their most private financial information.

Conventional finance trackers upload raw data to cloud servers for processing. This creates permanent privacy liabilities: data breaches, regulatory compliance burdens, and user trust erosion.

## Decision
We implemented a **client-first, zero-retention privacy model** with three layers:

### Layer 1: Client-Side WASM De-identification
- Transaction identifiers are scrubbed **in the browser** before any data reaches the backend
- Users control the scrubbing depth via a real-time slider (0% / 50% / 100%)
- Account numbers, UPI IDs, and card numbers are replaced with masked equivalents
- The frontend demonstrates this visually with side-by-side raw vs. scrubbed buffers

### Layer 2: Backend PII Masking
- All merchant names are converted to **SHA-256 hashes** (12-char prefixes) in logs and exports
- Transaction amounts and raw UPI strings are **never written** to persistent logs
- Upload IDs are obfuscated in audit logs using custom masking filters
- `src/data_governance.py` enforces these policies at the module level

### Layer 3: Aggressive Retention Policy
- **90-day auto-eviction**: Data older than `DATA_RETENTION_DAYS` is purged on startup
- **Session cap**: Maximum `MAX_SESSIONS` (10,000) enforced; oldest sessions evicted first
- **GDPR alignment**: Startup warnings if retention exceeds 365 days
- Session data uses `sessionStorage` (not `localStorage`), auto-clearing on tab close

## Consequences

### Positive
- **User trust**: Data never persists in readable form on the server
- **Regulatory compliance**: GDPR-aligned retention with automatic enforcement
- **Security posture**: Even a complete server breach reveals only hashed identifiers
- **Differentiation**: No other finance tracker offers client-side scrubbing with visual proof

### Negative
- **Offline analysis limited**: Backend cannot run analytics on scrubbed fields like merchant names
- **Smart categorization trade-off**: The `smart_categorizer.py` module must work with the scrubbed merchant names or use pre-scrubbing local classification
- **No data portability**: Since we don't retain raw data, historical trends across sessions require the user to re-upload

## References
- `src/data_governance.py` — Retention enforcement and PII masking
- `api/security.py` — Upload validation and constant-time auth
- `web/src/components/landing/sections/HeroSection.tsx` — WASM sandbox visualization
- `web/src/store/useKiraStore.ts` — sessionStorage persistence (L170)
