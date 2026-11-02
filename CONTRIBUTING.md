# Contributing to FarmSync

Thank you for helping build better tools for farmers. Contributions of every size are welcome: bug reports, translations, documentation, tests and features.

By taking part you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Report a bug** with the bug report form. Include steps to reproduce and your browser and device.
- **Suggest a feature** with the feature request form. Describe the farming problem first, then the solution.
- **Translate.** Add or improve strings in `public/locales/<lang>/translation.json`. New languages are very welcome.
- **Pick up an issue.** Issues labelled `good first issue` are a good starting point. Comment on the issue before you start so others know it is taken.
- **Improve the docs.** If something in the setup guide confused you, it will confuse others too.

## Development setup

Follow [docs/getting-started.md](docs/getting-started.md) to run the app against your own Supabase project. In short:

```bash
git clone https://github.com/<your-username>/farmsync.git
cd farmsync
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

## Making a change

1. Fork the repository and create a branch from `main`:

   ```bash
   git checkout -b fix/harvest-unit-conversion
   ```

   Use a prefix that matches the change: `feat/`, `fix/`, `docs/`, `refactor/`, `test/` or `chore/`.

2. Make your change. Keep pull requests focused: one bug fix or one feature per PR is much easier to review.

3. Run the checks:

   ```bash
   npm run check
   ```

   If you changed anything in `supabase/`, also run the database tests (see [docs/database.md](docs/database.md#testing-policies)).

4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):

   ```text
   feat(crops): record harvest quantity when marking a crop harvested
   fix(reports): use local dates for report ranges
   docs: explain device API keys
   ```

5. Push and open a pull request. Fill in the template, link the issue it closes, and add screenshots for UI changes.

## Code guidelines

### Frontend

- TypeScript everywhere. Avoid `any` in new code; use the generated `Tables<'table_name'>` types from `src/integrations/supabase/types.ts`.
- Put business logic that does not need React in `src/lib` and add a `*.test.ts` next to it. Components should mostly fetch, render and handle events.
- Fetch data with TanStack Query (`useQuery` / `useMutation`) and include every input that affects the result in the query key.
- Use the shadcn/ui components in `src/components/ui` and Tailwind utility classes. Avoid editing the `ui/` primitives unless the change benefits every use.
- Show an empty state that explains how to add data instead of placeholder or invented numbers.
- Pages must work at phone width. Many FarmSync users are on mobile.
- Add user-facing text to `public/locales/en/translation.json` and use `t()` on pages that are already translated.

### Database

- Never edit a migration that has already been merged; add a new one.
- Every new table needs RLS enabled and policies in the same migration, plus assertions in `supabase/tests/rls.test.sql`.
- Regenerate `src/integrations/supabase/types.ts` after schema changes.
- Never use the service role key in frontend code.

See [docs/database.md](docs/database.md) for the access model and migration workflow.

## Pull request review

A maintainer will review your PR, usually within a week. CI must pass (lint, typecheck, unit tests, build and database tests). Expect some back and forth; it is a normal part of keeping the codebase healthy and is not a judgement of your work.

## Reporting security issues

Do not open a public issue for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
