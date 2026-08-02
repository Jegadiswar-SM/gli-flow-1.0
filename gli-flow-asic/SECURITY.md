# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x beta | :white_check_mark: |

## Reporting a Vulnerability

GLI-FLOW takes security seriously. If you discover a vulnerability, please report it privately.

**Contact:** team@gatelevel.io
**PGP Key:** Not yet available.

**Expected response time:** You will receive an acknowledgment within 48 hours of your report. We will provide a detailed response with next steps within 5 business days.

**Process:**
1. Send the vulnerability details to team@gatelevel.io.
2. Do not publicly disclose the issue until we have released a fix and users can upgrade.
3. Include as much context as possible: steps to reproduce, affected versions, and potential impact.
4. We will coordinate a fix timeline with you and credit you in the release notes (unless you prefer to remain anonymous).

## Security Best Practices

### For Users
- **Set `GLI_ENCRYPTION_SECRET`** — Configure a strong, unique secret via environment variable when using encrypted file-protection paths. The implementation does not provide a safe fallback secret.
- **Use KMS when possible** — Set `GLI_KMS_KEY_ID` to integrate AWS KMS for key management instead of the environment-variable fallback.
- **Validate design paths** — Only run GLI-FLOW with trusted design directories and manifest files.
- **Pin dependencies** — Use locked environments (Docker, Conda, pip freeze) to avoid unexpected dependency changes.
- **Restrict API exposure** — When deploying the dashboard/API, put it behind a reverse proxy with authentication. Do not expose to the public internet without access controls.
- **Review CORS settings** — If you customize `CORS_ORIGINS`, restrict to known origins.

### For Deployments
- **Run EDA tools in sandboxed environments** — Use containers or user namespaces to limit the blast radius of tool exploits.
- **Monitor subprocess execution** — Review stage logs and watch for unexpected arguments. Subprocesses are bounded by stage timeout and optional resource limits.
- **Keep dependencies updated** — Run `pip-audit` regularly and monitor advisory databases.
- **Use read-only PDK paths** — Mount PDK directories read-only to prevent tampering.
- **Enable CI security scanning** — Integrate Bandit (SAST), CodeQL, and Gitleaks (secrets) into your pipeline.
