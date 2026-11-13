import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFarmScope } from './useFarmScope';

/**
 * Farms (id and name) of the workspace chosen in the sidebar, by name.
 * The farm picker and the "no farm yet" message share this one cache entry.
 * `isPending` is also true while the workspaces themselves are still loading.
 */
export function useWorkspaceFarms() {
  const scope = useFarmScope();
  const { data: farms = [], isPending, isFetching, error } = useQuery({
    // Each query shape needs its own key: components that share a key share one cache entry.
    queryKey: ['farms', 'selector', scope.key],
    enabled: scope.ready,
    queryFn: async () => {
      const { data, error } = await scope.apply(supabase.from('farms').select('id, name')).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
  return { farms, isPending, isFetching, error };
}
