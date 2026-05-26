# PHIS Sentinel

PHIS Sentinel is an endpoint-native, serverless anti-phishing browser extension for Gmail and Outlook Web. Email content never leaves the device. Detection combines deterministic security rules, URL intelligence, local threat feeds, and local NLP inference.

## Stack

- Plasmo + Manifest V3
- React + TypeScript + TailwindCSS
- Dexie (IndexedDB)
- Transformers.js and ONNX Runtime Web
- CSP-safe extension architecture

## Local Development

1. Install dependencies:
   - `npm.cmd install --ignore-scripts`
2. Start extension development:
   - `npm.cmd run dev`
3. Build package:
   - `npm.cmd run build`

Note: In strict corporate environments, optional native postinstall artifacts may fail TLS validation. Use enterprise certificate trust or internal artifact mirrors for production CI.

## Production Folder Structure

```text
src/
  background.ts
  popup.tsx
  contents/
    gmail.tsx
    outlook.tsx
  background/
    workers/
  parsers/
  engines/
    rules/
    ml/
    url/
    scoring/
  threatfeeds/
  security/
  storage/
  ui/
    components/
    hooks/
  types/
contents/
  gmail.tsx
  outlook.tsx
assets/
  models/
  feeds/
policies/
docs/
  architecture/
  deployment/
```

## Core Runtime Flow

1. Content script extracts opened email artifact (sender, subject, body, links, attachment metadata).
2. Artifact sent to background for local analysis.
3. Engine executes rule checks, URL intelligence, threat feed lookup, and local NLP inference.
4. Weighted score and confidence are generated with explainability indicators.
5. Result is displayed in popup and inline banner, and stored in IndexedDB for local history.

## Security Principles

- Zero-trust extension boundaries
- No remote upload of email content
- CSP-constrained execution
- No `eval` or remote dynamic script execution
- DOM sanitization and strict parsing controls
- Enterprise managed policy support via `chrome.storage.managed`

See architecture docs for full details:

- `docs/architecture/production-architecture.md`
- `docs/architecture/threat-model.md`
- `docs/deployment/enterprise-deployment.md`
- `docs/roadmap.md`
