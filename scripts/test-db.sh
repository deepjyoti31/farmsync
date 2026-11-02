#!/usr/bin/env bash
# Apply every migration to a disposable PostgreSQL database and run the RLS tests.
#
# Usage:
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-db.sh
#
# WARNING: point this only at a throwaway database (local Docker, CI service).
# It creates Supabase stand-in roles and an auth schema, and it refuses to run
# against a *.supabase.co host.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to a disposable PostgreSQL database}"

if [[ "$DATABASE_URL" == *"supabase.co"* || "$DATABASE_URL" == *"supabase.com"* ]]; then
  echo "Refusing to run against a hosted Supabase database." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -X)

echo "==> Installing Supabase stand-ins"
"${PSQL[@]}" -f "$ROOT/supabase/tests/supabase_shim.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "==> Applying $(basename "$migration")"
  # Hide "already exists, skipping" notices; warnings and errors still show.
  PGOPTIONS="--client-min-messages=warning" "${PSQL[@]}" -f "$migration" > /dev/null
done

echo "==> Re-applying the latest migration to check it is idempotent"
latest="$(ls "$ROOT"/supabase/migrations/*.sql | sort | tail -n 1)"
PGOPTIONS="--client-min-messages=warning" "${PSQL[@]}" -f "$latest" > /dev/null

echo "==> Running RLS tests"
"${PSQL[@]}" -o /dev/null -f "$ROOT/supabase/tests/rls.test.sql" 2>&1 | sed -E "s/^psql:[^ ]+ NOTICE:  //"
