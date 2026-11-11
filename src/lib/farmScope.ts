/**
 * Which farms belong to the selected workspace.
 *
 * A team workspace holds the farms saved under it. The personal workspace also
 * holds farms with no workspace at all: farms created before workspaces
 * existed, which only their owner can see. Without that rule those farms would
 * not appear anywhere.
 */

export interface WorkspaceLike {
  id: string;
  is_personal?: boolean | null;
}

/** The two filters of the Supabase query builder that scoping needs. */
interface Scopable {
  eq(column: string, value: string): unknown;
  or(filters: string): unknown;
}

export interface FarmScope {
  /** Goes into query keys, so each workspace has its own cache entry. */
  key: string;
  /** Narrows a query on `farms` to the workspace. With no workspace it changes nothing. */
  apply<Q>(query: Q): Q;
  /** The same rule for a farm row already in memory. */
  includes(farm: { organization_id?: string | null }): boolean;
}

export function farmScope(workspace: WorkspaceLike | null | undefined): FarmScope {
  if (!workspace) {
    return { key: 'all', apply: (query) => query, includes: () => true };
  }
  const { id } = workspace;
  if (workspace.is_personal) {
    return {
      key: id,
      // The builder's own types are too deep to thread through a generic; filters return the same builder.
      apply: <Q>(query: Q) => (query as unknown as Scopable).or(`organization_id.eq.${id},organization_id.is.null`) as Q,
      includes: (farm) => farm.organization_id == null || farm.organization_id === id,
    };
  }
  return {
    key: id,
    apply: <Q>(query: Q) => (query as unknown as Scopable).eq('organization_id', id) as Q,
    includes: (farm) => farm.organization_id === id,
  };
}
