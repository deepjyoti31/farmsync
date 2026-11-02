## Summary

<!-- What does this change and why? Link the issue it closes, e.g. "Closes #12". -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Database migration
- [ ] Documentation
- [ ] Refactor or tooling

## How was this tested?

<!-- Steps a reviewer can follow, plus any automated tests added. -->

## Checklist

- [ ] `npm run check` passes (lint, typecheck, tests, build)
- [ ] New SQL is in a new migration file; existing migrations are not edited
- [ ] New tables have RLS enabled with policies, and `scripts/test-db.sh` passes
- [ ] `src/integrations/supabase/types.ts` is regenerated if the schema changed
- [ ] User-facing text is added to `public/locales/en/translation.json` where the page is translated
- [ ] Screenshots attached for UI changes
