// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '@/test/supabaseMock';

const { mock, auth } = vi.hoisted(() => ({
  mock: { current: null as unknown as ReturnType<typeof createSupabaseMock> },
  auth: {
    currentOrganization: { id: 'team-1', is_personal: false } as { id: string; is_personal: boolean } | null,
    organizationsReady: true,
  },
}));
vi.mock('@/integrations/supabase/client', () => ({
  get supabase() {
    return mock.current.client;
  },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
// The add-farm form pulls in the map; the picker's behaviour does not need it.
vi.mock('./AddFarmForm', () => ({ default: () => null }));
mock.current = createSupabaseMock();

import FarmSelector from './FarmSelector';

const show = (selectedFarmId: string | null, onFarmChange: (id: string | null) => void) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={onFarmChange} />
    </QueryClientProvider>,
  );

describe('FarmSelector', () => {
  beforeEach(() => {
    mock.current.reset();
    auth.currentOrganization = { id: 'team-1', is_personal: false };
    auth.organizationsReady = true;
  });
  afterEach(cleanup);

  it('asks only for the farms of the selected team workspace', async () => {
    mock.current.respond({ data: [{ id: 'f1', name: 'North' }] });
    const onChange = vi.fn();
    show(null, onChange);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('f1'));
    expect(mock.current.argsOf(mock.current.queries[0], 'eq')).toEqual(['organization_id', 'team-1']);
  });

  it('includes farms without a workspace in the personal workspace', async () => {
    auth.currentOrganization = { id: 'me', is_personal: true };
    mock.current.respond({ data: [{ id: 'f1', name: 'North' }] });
    const onChange = vi.fn();
    show(null, onChange);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('f1'));
    expect(mock.current.argsOf(mock.current.queries[0], 'or')).toEqual(['organization_id.eq.me,organization_id.is.null']);
  });

  it('replaces a selected farm that belongs to another workspace', async () => {
    mock.current.respond({ data: [{ id: 'f1', name: 'North' }, { id: 'f2', name: 'South' }] });
    const onChange = vi.fn();
    show('farm-of-another-workspace', onChange);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('f1'));
  });

  it('clears the selection when the workspace has no farms', async () => {
    mock.current.respond({ data: [] });
    const onChange = vi.fn();
    show('farm-of-another-workspace', onChange);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(null));
  });

  it('leaves a valid selection alone', async () => {
    mock.current.respond({ data: [{ id: 'f1', name: 'North' }, { id: 'f2', name: 'South' }] });
    const onChange = vi.fn();
    const { findByText } = show('f2', onChange);
    await findByText('South');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('waits for the workspaces before loading farms', async () => {
    auth.organizationsReady = false;
    const onChange = vi.fn();
    const { findByText } = show('f2', onChange);
    await findByText('Loading farms...');
    expect(mock.current.queries).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });
});
