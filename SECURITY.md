# Security policy

FarmSync stores farm records, financial data and personal details, so we take security reports seriously.

## Supported versions

Security fixes are made on the `main` branch and included in the next release. Self-hosted deployments should update to the latest `main` (or latest release) and apply any new migrations.

## Reporting a vulnerability

**Please do not report security vulnerabilities in public issues, discussions or pull requests.**

Report privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/deepjyoti31/farmsync/security/advisories/new>).

Please include:

- a description of the issue and its impact;
- steps to reproduce, or a proof of concept;
- the affected files, routes or tables if you know them.

What to expect:

- acknowledgement within 3 business days;
- an assessment and planned fix timeline within 10 business days;
- credit in the release notes if you would like it, once a fix is released.

## Scope

Particularly valuable reports include:

- Row Level Security gaps: any way for a user to read or change another user's or organization's data;
- privilege escalation within an organization (for example a viewer gaining write access);
- weaknesses in device API key handling or the `ingest-telemetry` function;
- exposure of secrets (service role key, WeatherAPI key) to the browser.

Out of scope: vulnerabilities in third-party services themselves (Supabase, Mapbox, WeatherAPI.com), and issues that require a compromised device or browser.

## Guidance for self-hosters

- Never expose the Supabase `service_role` key to the frontend or commit it to the repository.
- Apply every migration; the RLS policies are what protect your data.
- Restrict your Mapbox token to your own domain.
- Keep dependencies current; Dependabot is configured for this repository.
