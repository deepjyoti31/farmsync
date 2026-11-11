import { describe, expect, it } from 'vitest';
import { farmScope } from './farmScope';

/** Records the filters applied, like the Supabase query builder. */
const query = () => {
  const calls: string[] = [];
  const q = {
    calls,
    eq(column: string, value: string) {
      calls.push(`eq:${column}=${value}`);
      return q;
    },
    or(filters: string) {
      calls.push(`or:${filters}`);
      return q;
    },
  };
  return q;
};

describe('farmScope', () => {
  it('limits a team workspace to its own farms', () => {
    const scope = farmScope({ id: 'team-1', is_personal: false });
    expect(scope.apply(query()).calls).toEqual(['eq:organization_id=team-1']);
    expect(scope.includes({ organization_id: 'team-1' })).toBe(true);
    expect(scope.includes({ organization_id: 'team-2' })).toBe(false);
    expect(scope.includes({ organization_id: null })).toBe(false);
    expect(scope.key).toBe('team-1');
  });

  it('keeps farms without a workspace in the personal workspace', () => {
    const scope = farmScope({ id: 'me', is_personal: true });
    expect(scope.apply(query()).calls).toEqual(['or:organization_id.eq.me,organization_id.is.null']);
    expect(scope.includes({ organization_id: 'me' })).toBe(true);
    expect(scope.includes({ organization_id: null })).toBe(true);
    expect(scope.includes({})).toBe(true);
    expect(scope.includes({ organization_id: 'team-1' })).toBe(false);
  });

  it('does not filter when there is no workspace', () => {
    const scope = farmScope(null);
    expect(scope.apply(query()).calls).toEqual([]);
    expect(scope.includes({ organization_id: 'anything' })).toBe(true);
    expect(scope.key).toBe('all');
  });

  it('gives each workspace its own cache key', () => {
    expect(farmScope({ id: 'a' }).key).not.toBe(farmScope({ id: 'b' }).key);
  });
});
