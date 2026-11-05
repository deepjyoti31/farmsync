// @vitest-environment jsdom
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '@/test/supabaseMock';

const { mock, i18n } = vi.hoisted(() => ({
  mock: { current: null as unknown as ReturnType<typeof createSupabaseMock> },
  i18n: { language: 'en', dir: (lng: string) => (lng === 'ar' ? 'rtl' : 'ltr') },
}));
vi.mock('@/integrations/supabase/client', () => ({
  get supabase() {
    return mock.current.client;
  },
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n }) }));
mock.current = createSupabaseMock();

import { useOnlineStatus } from './useOnlineStatus';
import { useIsMobile } from './use-mobile';
import { useDirection } from './useDirection';
import { useFarmMembers } from './useFarmMembers';
import { reducer, toast, useToast } from './use-toast';

describe('useOnlineStatus', () => {
  it('follows the browser online and offline events', () => {
    const { result, unmount } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(navigator.onLine);

    act(() => void window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    act(() => void window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);

    const remove = vi.spyOn(window, 'removeEventListener');
    unmount();
    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});

describe('useIsMobile', () => {
  let listener: (() => void) | null = null;
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      addEventListener: (_: string, fn: () => void) => (listener = fn),
      removeEventListener: vi.fn(),
    }));
  });

  it('is true below 768 px and updates on resize', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    act(() => listener?.());
    expect(result.current).toBe(false);
  });

  it('treats exactly 768 px as desktop', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 });
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
  });
});

describe('useDirection', () => {
  afterEach(() => {
    i18n.language = 'en';
  });

  it('sets the document direction and language from i18n', () => {
    i18n.language = 'ar';
    renderHook(() => useDirection());
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');

    i18n.language = 'hi';
    renderHook(() => useDirection());
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('hi');
  });
});

describe('useFarmMembers', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
  );

  beforeEach(() => mock.current.reset());

  it('lists the farm owner and team members by name, without duplicates', async () => {
    mock.current.respond(
      { data: { user_id: 'owner', organization_id: 'org-1' } },
      { data: [{ user_id: 'owner' }, { user_id: 'u2' }, { user_id: 'u3' }] },
      {
        data: [
          { id: 'owner', first_name: 'Ravi', last_name: 'Das' },
          { id: 'u2', first_name: 'Anita', last_name: null },
          { id: 'u3', first_name: null, last_name: null },
        ],
      },
    );
    const { result } = renderHook(() => useFarmMembers('farm-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { id: 'u2', name: 'Anita' },
      { id: 'owner', name: 'Ravi Das' },
      { id: 'u3', name: 'Unnamed member' },
    ]);
    const profiles = mock.current.queries[2];
    expect(mock.current.argsOf(profiles, 'in')).toEqual(['id', ['owner', 'u2', 'u3']]);
  });

  it('lists only the owner for a farm outside any team', async () => {
    mock.current.respond(
      { data: { user_id: 'owner', organization_id: null } },
      { data: [{ id: 'owner', first_name: 'Ravi', last_name: '' }] },
    );
    const { result } = renderHook(() => useFarmMembers('farm-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 'owner', name: 'Ravi' }]);
    expect(mock.current.queries.map((q) => q.table)).toEqual(['farms', 'profiles']);
  });

  it('does not query without a farm', () => {
    const { result } = renderHook(() => useFarmMembers(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mock.current.queries).toHaveLength(0);
  });

  it.each([
    ['farm', [{ error: { message: 'farm failed' } }]],
    ['members', [{ data: { user_id: 'o', organization_id: 'org' } }, { error: { message: 'members failed' } }]],
    ['profiles', [{ data: { user_id: 'o', organization_id: null } }, { error: { message: 'profiles failed' } }]],
  ])('surfaces a %s lookup error', async (_name, responses) => {
    mock.current.respond(...responses);
    const { result } = renderHook(() => useFarmMembers('farm-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as unknown as { message: string }).message).toMatch(/failed$/);
  });
});

describe('toast store', () => {
  // Ids that toast() itself never generates: the store's removal timers are module state.
  const base = { id: 'r1', title: 'Saved', open: true };

  it('keeps only the newest toast', () => {
    const state = reducer({ toasts: [base] }, { type: 'ADD_TOAST', toast: { ...base, id: 'r2' } });
    expect(state.toasts.map((t) => t.id)).toEqual(['r2']);
  });

  it('updates, dismisses and removes toasts', () => {
    let state = reducer({ toasts: [base] }, { type: 'UPDATE_TOAST', toast: { id: 'r1', title: 'Changed' } });
    expect(state.toasts[0].title).toBe('Changed');
    state = reducer(state, { type: 'UPDATE_TOAST', toast: { id: 'other', title: 'x' } });
    expect(state.toasts[0].title).toBe('Changed');

    state = reducer(state, { type: 'DISMISS_TOAST', toastId: 'r1' });
    expect(state.toasts[0].open).toBe(false);
    state = reducer({ toasts: [base] }, { type: 'DISMISS_TOAST' });
    expect(state.toasts[0].open).toBe(false);

    expect(reducer({ toasts: [base] }, { type: 'REMOVE_TOAST', toastId: 'r1' }).toasts).toEqual([]);
    expect(reducer({ toasts: [base] }, { type: 'REMOVE_TOAST' }).toasts).toEqual([]);
  });

  it('shows a toast to subscribers and dismisses it', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());
    let handle: ReturnType<typeof toast>;
    act(() => {
      handle = toast({ title: 'Hello' });
    });
    expect(result.current.toasts[0]).toMatchObject({ title: 'Hello', open: true });

    act(() => handle.update({ id: handle.id, title: 'Updated' }));
    expect(result.current.toasts[0].title).toBe('Updated');

    act(() => result.current.toasts[0].onOpenChange?.(false));
    expect(result.current.toasts[0].open).toBe(false);

    act(() => result.current.dismiss());
    act(() => void vi.runAllTimers());
    expect(result.current.toasts).toEqual([]);
    vi.useRealTimers();
  });
});
