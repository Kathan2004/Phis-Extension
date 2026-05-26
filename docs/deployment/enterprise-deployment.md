# Enterprise Deployment Strategy

## Managed Configuration

Use managed policy schema in `policies/managed_storage_schema.json` and distribute baseline values:

- `strictMode`
- `maxModelLatencyMs`
- `blockCriticalLinks`
- `adminMode`

## Intune (Microsoft Endpoint Manager)

1. Package extension for Chromium deployment.
2. Assign extension ID allowlist and force-install policy.
3. Push managed storage policy JSON to Edge/Chrome profile settings.
4. Validate policy retrieval with pilot ring before broad rollout.

## Google Workspace

1. Publish extension to private Chrome Web Store listing.
2. Force-install to organizational units.
3. Distribute managed policy values via Chrome admin templates.
4. Stage deployment by OU risk profile.

## JAMF / macOS Fleet

1. Deploy Chrome/Edge extension payload via configuration profile.
2. Apply managed preferences (JSON) using custom schema.
3. Pair with browser hardening profile (extension install lock).

## Security Admin Mode

- Enables local diagnostics and troubleshooting metadata.
- Does not expose plaintext email content.
- Intended for SOC analysts and support teams.

## Rollout Rings

- Ring 0: Security engineering validation.
- Ring 1: High-risk user pilot (finance, HR, exec assistants).
- Ring 2: Full enterprise rollout.

## Incident Operations

- Update local threat feeds and enterprise policy thresholds.
- Ship extension package updates with signed release workflow.
- Maintain rollback version channel.
