# Database and security

FarmSync stores everything in a Supabase PostgreSQL database. The browser connects with the public anon key, so **Row Level Security (RLS) is the security boundary**: every table in `public` has RLS enabled, and a policy must explicitly allow each read or write.

## Schema overview

| Domain | Tables |
| --- | --- |
| Identity and tenancy | `profiles`, `organizations`, `organization_members`, `organization_invites` |
| Land | `farms`, `fields` |
| Crops | `crops` (shared catalogue), `field_crops` (plantings), `harvests` |
| Livestock | `livestock_types` (reference), `livestock`, `livestock_health_records`, `livestock_production` |
| Operations | `tasks`, `inventory_categories` (reference), `inventory`, `inventory_transactions`, `equipment`, `equipment_maintenance` |
| Money | `financial_categories`, `financial_transactions`, `loans`, `insurance_policies`, `insurance_claims`, `payments` |
| Sustainability | `sustainability_logs` (fertiliser, pesticide and other inputs), `water_usage` |
| IoT | `devices`, `telemetry` |
| Compliance | `compliance_standards`, `compliance_rules`, `farm_subscriptions`, `compliance_audits` |
| Cooperatives | `bulk_orders`, `bulk_order_items`, `member_orders`, `produce_batches`, `batch_contributions` |
| Market | `market_data` (mandi prices), `marketplace_listings`, `marketplace_inquiries`, `suppliers` |
| Community | `forums`, `forum_posts`, `post_comments`, `post_likes`, `expert_tips` |
| Notifications and marketing | `notifications`, `testimonials`, `app_screenshots` |

Most operational data hangs off a farm, either directly (`farm_id`) or through a parent row (a harvest belongs to a planting, which belongs to a field, which belongs to a farm).

## Access model

Access decisions are made by a few `SECURITY DEFINER` helper functions, defined in the latest migration, so policies stay short and consistent:

| Function | Returns true when |
| --- | --- |
| `is_org_member(org_id, roles[])` | The current user is a member of the organization with one of the given roles (any role by default) |
| `can_access_farm(farm_id)` | The user owns the farm or is any member of the farm's organization |
| `can_edit_farm(farm_id, roles[])` | The user owns the farm or is a member with one of the given roles (owner, admin or editor by default) |
| `field_farm_id(field_id)`, `field_crop_farm_id(field_crop_id)` | Resolve child rows to their farm |

Policy patterns:

| Kind of table | Read | Write |
| --- | --- | --- |
| Farm data (`fields`, `tasks`, `inventory`, `livestock`, `devices`, ...) | `can_access_farm` | `can_edit_farm` (owner, admin, editor) |
| Financial products (`loans`, `insurance_policies`, `insurance_claims`) | `can_access_farm` | `can_edit_farm` with owner or admin only |
| Child rows (`harvests`, `telemetry`, `equipment_maintenance`, ...) | Through the parent's farm | Through the parent's farm |
| Organization data (`bulk_orders`, `produce_batches`) | Any member | Owner or admin |
| Personal data (`notifications`, `payments`, own `profiles` row) | Owner only | Owner only |
| Reference and community data (`crops`, `livestock_types`, `forums`, `forum_posts`, `market_data`, ...) | Everyone | Authors for their own posts; reference data via the service role |

`livestock_production` rows always carry a `farm_id`, so an entry can describe a whole herd or flock (for example a day's eggs) as well as a single animal. A trigger fills `farm_id` from the animal when `livestock_id` is given.

`telemetry` has no write policy on purpose: only the `ingest-telemetry` edge function writes it, using the service role, which bypasses RLS.

### File storage

Profile pictures live in the public `avatars` bucket, created by migration. Policies on `storage.objects` allow a signed-in user to upload, replace and delete files only under `avatars/<their user id>/`. The bucket accepts JPG, PNG and WebP up to 2 MB.

### New users

The `on_auth_user_created` trigger on `auth.users` runs `handle_new_user()`, which creates the user's `profiles` row (copying first and last name from the sign-up metadata) and a personal workspace with the user as owner.

## Migrations

Migrations live in `supabase/migrations/` and run in filename order.

**Rules for changing the schema:**

1. **Never edit a migration that has been merged.** Deployed databases have already run it. Add a new file instead.
2. Name new files `YYYYMMDDHHMMSS_short_description.sql`, using the current UTC time.
3. Make migrations idempotent where practical (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`) so they can be re-applied safely.
4. **Every new table must enable RLS and have policies** in the same migration. The test suite fails if any public table lacks either.
5. Regenerate TypeScript types afterwards (below).

### Creating a migration

```bash
npx supabase migration new add_irrigation_schedules
# edit the new file in supabase/migrations/
npx supabase db reset        # local Supabase: rebuild from all migrations
npm run db:types             # regenerate src/integrations/supabase/types.ts
```

`npm run db:types` reads from a local Supabase stack (`npx supabase start`, which needs Docker). To generate from a hosted project instead:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/integrations/supabase/types.ts
```

### Applying to a hosted project

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Testing policies

`scripts/test-db.sh` applies every migration to a throwaway PostgreSQL database and runs `supabase/tests/rls.test.sql`. The test creates two users and checks, among other things, that:

- signing up creates a profile and personal workspace;
- a farm owner can read and write their data;
- a stranger cannot see a farm, its harvests or tasks, and cannot add themselves to someone else's organization;
- a viewer can read team data but cannot insert or update;
- every public table has RLS enabled and at least one policy.

Run it locally against any disposable Postgres 15+ instance, for example with Docker:

```bash
docker run --rm -d --name farmsync-pg -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:16
DATABASE_URL=postgresql://postgres@localhost:5432/postgres scripts/test-db.sh
docker stop farmsync-pg
```

The script installs small stand-ins for Supabase's `auth` schema and roles (`supabase/tests/supabase_shim.sql`) and refuses to run against a hosted Supabase URL. CI runs it on every pull request.

When you add a table or change a policy, add assertions for it to `rls.test.sql`.
