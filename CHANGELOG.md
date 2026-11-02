# Changelog

All notable changes to FarmSync are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## Unreleased

## 0.2.0 - 2026-11-02

A stabilisation release: the modules added in 0.1 now work end to end against a freshly migrated database.

### Fixed

- Cooperative, Financial Services, Compliance and Organization Settings pages were unreachable (routes resolved to `/dashboard/dashboard/...`). Organization Settings now lives at `/dashboard/organization`.
- Production build failed because the single 3.2 MB bundle exceeded the PWA precache limit.
- Tasks, inventory, livestock and expert tips failed on fresh installs because their tables were missing from the migrations.
- About twenty tables (crops, harvests, organizations, sensors, cooperatives, loans, insurance and more) had RLS enabled with no policies, so users could not read or write them.
- New users had no profile or personal workspace.
- Profile page saved to non-existent columns, so phone numbers and avatars were never stored.
- Community page queried a non-existent table.
- Market "All commodities" and "All states" filters returned no rows, and the price trend was random.
- Sustainability logs ignored the selected farm.
- Report date ranges were a day early for users east of UTC, and "Last quarter" could land in the wrong year.
- Analytics crashed on transactions without a category.
- Supabase helper scripts could not run in an ES module package.

### Changed

- Every page is lazy-loaded and vendor libraries are split into separate chunks; the entry bundle is now about 130 kB.
- Placeholder data replaced with real queries: yield analytics, sensor telemetry, loans, insurance, credit score, cooperative crop mix, community stats and notifications.
- The compliance check evaluates banned-input rules against the input log instead of always reporting success.
- Device API keys are generated with a cryptographically secure random source.
- The app shows a setup screen instead of a blank page when Supabase credentials are missing.

### Added

- Recording harvest quantity when a crop is marked harvested.
- CSV export for financial, production, equipment, input and water usage reports.
- Migration `20261102000001_restore_tables_and_access_policies.sql` with role-based access helpers and reference data.
- Unit tests (Vitest) for business logic and SQL tests for Row Level Security.
- GitHub Actions CI, issue and PR templates, Dependabot, CODEOWNERS.
- Documentation: getting started, architecture, database and security, IoT integration, deployment, roadmap, contributing, security policy and code of conduct.

## 0.1.0 - 2025-12-19

Initial public version: farms, fields with boundary mapping, crops, livestock, inventory, equipment, finances, weather, IoT device registry, analytics, community forums, marketplace, cooperatives, financial services, compliance, multi-language support and PWA install.
