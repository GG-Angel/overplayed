# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately through GitHub, using
[**Report a vulnerability**](https://github.com/GG-Angel/overplayed-new/security/advisories/new)
under the repository's Security tab.

Do not open a public issue or pull request for a security vulnerability.

A useful report includes:

- The affected component (`web`, `server`, or `queue`) and, if possible, the relevant file or endpoint
- Steps to reproduce, or a proof of concept
- What an attacker could accomplish with it

You can expect an initial reply within a week. If the report is valid, you'll get
updates as a fix is developed, and you're welcome to be credited in the advisory
once it's published.

## Scope

In scope:

- The Overplayed web client
- `api-overplayed.gaelangel.com` (API)
- `queue-overplayed.gaelangel.com` (queue service)
- Source code in this repository, including CI/CD workflows and deployment configuration

Out of scope:

- Vulnerabilities in third-party services Overplayed depends on (report those to
  the service directly)
- Denial of service and volumetric testing
- Reports from automated scanners with no demonstrated impact

Please limit testing to accounts and data you own, and avoid actions that
degrade the service for other users.
