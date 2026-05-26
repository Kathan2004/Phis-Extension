# Threat Model

## Assets

- User mailbox content in browser session.
- Extension analysis outputs and confidence scores.
- Local threat indicator database.
- Enterprise security policies.

## Trust Boundaries

- Boundary A: Webmail DOM to content script.
- Boundary B: Content scripts to background service worker.
- Boundary C: Background analyzer to IndexedDB persistence.
- Boundary D: Enterprise managed policy storage to runtime behavior.

## High-Risk Threats

1. DOM tampering by malicious page scripts.
2. Prompt/HTML injection into extension UI surfaces.
3. Extension over-permission and privilege abuse.
4. Model poisoning via untrusted model files.
5. Local data exfiltration by malicious extension interactions.
6. Evasion via unicode spoofing, hidden anchors, and redirect chains.

## Mitigations

- Isolated extension worlds and strict message type checks.
- DOM sanitization for any rendered email-derived markup.
- Minimal host and API permissions.
- Signed/pinned model package strategy for enterprise builds.
- No outbound email payload transmission.
- Multi-engine scoring (rules + ML + feeds) to reduce single-point evasion.

## Residual Risks

- Zero-day social engineering patterns may bypass static rules.
- Browser DOM changes in Gmail/Outlook can reduce parser fidelity.
- Local false positives in strict mode can impact usability.

## Security Test Plan

- Malicious HTML corpus tests for parser and sanitizer boundaries.
- Homoglyph, punycode, and anchor mismatch synthetic test suites.
- Performance tests on large email threads.
- Regression tests for provider DOM selector changes.
