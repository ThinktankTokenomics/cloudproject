# Security policy

TrustGate is a learning project and is not intended for production use. Please do not submit real credentials, private keys, or personal data in issues or pull requests.

## Reporting a problem

For a private report, use GitHub's **Report a vulnerability** option on the repository's Security tab when it is available. If private vulnerability reporting is not enabled, contact the repository owner privately before sharing details publicly.

## Current project boundaries

- The application is stateless and does not handle user accounts or store user data.
- The status endpoint intentionally does not return environment variables.
- Render deployment credentials belong in GitHub repository secrets, never in source files or container build arguments.
- The pipeline is an educational demonstration. It does not replace code review, protected branch rules, production monitoring, or an incident response process.
