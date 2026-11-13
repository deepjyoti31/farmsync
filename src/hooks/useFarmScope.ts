import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { farmScope, type FarmScope } from '@/lib/farmScope';

/**
 * The farm filter for the workspace chosen in the sidebar. `ready` is false
 * until the workspaces have loaded: farm lists wait for it, so they never
 * flash every farm the person can see before narrowing down.
 */
export function useFarmScope(): FarmScope & { ready: boolean } {
  const { currentOrganization, organizationsReady } = useAuth();
  const id = currentOrganization?.id;
  const personal = currentOrganization?.is_personal;
  return useMemo(
    () => ({ ...farmScope(id ? { id, is_personal: personal } : null), ready: organizationsReady }),
    [id, personal, organizationsReady],
  );
}
