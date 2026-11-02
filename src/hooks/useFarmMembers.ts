import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FarmMember {
  id: string;
  name: string;
}

/**
 * People who can be assigned work on a farm: its owner plus every member of
 * the organization the farm belongs to.
 */
export function useFarmMembers(farmId: string | null) {
  return useQuery({
    queryKey: ['farm_members', farmId],
    enabled: !!farmId,
    queryFn: async (): Promise<FarmMember[]> => {
      const { data: farm, error: farmError } = await supabase
        .from('farms')
        .select('user_id, organization_id')
        .eq('id', farmId!)
        .single();
      if (farmError) throw farmError;

      const ids = new Set<string>([farm.user_id]);
      if (farm.organization_id) {
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', farm.organization_id);
        if (error) throw error;
        members?.forEach((m) => ids.add(m.user_id));
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', Array.from(ids));
      if (profileError) throw profileError;

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return Array.from(ids)
        .map((id) => {
          const p = byId.get(id);
          const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();
          return { id, name: name || 'Unnamed member' };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}
