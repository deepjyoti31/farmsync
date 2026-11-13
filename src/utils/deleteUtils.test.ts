import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '@/test/supabaseMock';

const { mock, toast } = vi.hoisted(() => ({
  mock: { current: null as unknown as ReturnType<typeof createSupabaseMock> },
  toast: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  get supabase() {
    return mock.current.client;
  },
}));
vi.mock('@/hooks/use-toast', () => ({ toast }));

mock.current = createSupabaseMock();

import { deleteById, deleteEntity, errorMessage, NotSavedError, updateById, updateByIdOrThrow } from './deleteUtils';

beforeEach(() => {
  mock.current.reset();
  toast.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('errorMessage', () => {
  it('reads Error instances, Supabase error objects and strings', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    // supabase-js returns errors as plain objects, not Error instances.
    expect(errorMessage({ message: 'violates foreign key constraint', code: '23503' })).toBe('violates foreign key constraint');
    expect(errorMessage('plain text')).toBe('plain text');
  });

  it('falls back when there is no usable message', () => {
    expect(errorMessage(null)).toBe('An unknown error occurred');
    expect(errorMessage({ message: 42 })).toBe('An unknown error occurred');
    expect(errorMessage(new Error(''), 'Nope')).toBe('Nope');
    expect(errorMessage('', 'Nope')).toBe('Nope');
  });
});

describe('deleteById', () => {
  it('deletes by id and selects the row back', async () => {
    mock.current.respond({ data: [{ id: 't1' }] });
    await expect(deleteById('tasks', 't1')).resolves.toBeNull();

    const [q] = mock.current.queries;
    expect(q.table).toBe('tasks');
    expect(q.calls.map((c) => c.method)).toEqual(['delete', 'eq', 'select']);
    expect(mock.current.argsOf(q, 'eq')).toEqual(['id', 't1']);
  });

  it('reports a delete that row level security silently skipped', async () => {
    // A viewer's delete returns no error and no rows.
    mock.current.respond({ data: [] });
    const problem = await deleteById('farms', 'f1', 'Green Acres');
    expect(problem).toMatch(/^Green Acres was not deleted/);
  });

  it('treats a missing data array as not deleted', async () => {
    mock.current.respond({ data: null });
    expect(await deleteById('equipment', 'e1')).toMatch(/^This item was not deleted/);
  });

  it('returns the database error message', async () => {
    mock.current.respond({ error: { message: 'permission denied for table farms' } });
    expect(await deleteById('farms', 'f1')).toBe('permission denied for table farms');
  });
});

describe('deleteEntity', () => {
  it('maps entity types to tables, toasts and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    mock.current.respond({ data: [{ id: 'c1' }] });

    await deleteEntity({ id: 'c1', entityType: 'crop', onSuccess, onError });

    expect(mock.current.queries[0].table).toBe('field_crops');
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deleted successfully' }));
  });

  it.each([
    ['farm', 'farms'],
    ['field', 'fields'],
    ['transaction', 'financial_transactions'],
    ['inventory', 'inventory'],
    ['equipment', 'equipment'],
    ['livestock', 'livestock'],
  ] as const)('deletes a %s from %s', async (entityType, table) => {
    mock.current.respond({ data: [{ id: 'x' }] });
    await deleteEntity({ id: 'x', entityType });
    expect(mock.current.queries[0].table).toBe(table);
  });

  it('shows the real message of a Supabase error and calls onError', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    mock.current.respond({ error: { message: 'update or delete on table "fields" violates foreign key constraint' } });

    await deleteEntity({ id: 'f1', entityType: 'field', onSuccess, onError });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toContain('violates foreign key constraint');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to delete field',
        description: expect.stringContaining('violates foreign key constraint'),
        variant: 'destructive',
      }),
    );
  });

  it('does not report success when nothing was deleted', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    mock.current.respond({ data: [] });

    await deleteEntity({ id: 'l1', entityType: 'livestock', onSuccess, onError });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Failed to delete livestock', variant: 'destructive' }));
  });

  it('rejects an unknown entity type without touching the database', async () => {
    const onError = vi.fn();
    await deleteEntity({ id: 'x', entityType: 'spaceship' as never, onError });
    expect(mock.current.queries).toHaveLength(0);
    expect(onError.mock.calls[0][0].message).toBe('Unknown entity type: spaceship');
  });

  it('works without callbacks', async () => {
    mock.current.respond({ error: { message: 'nope' } });
    await expect(deleteEntity({ id: 'x', entityType: 'farm' })).resolves.toBeUndefined();
  });
});

describe('updateById', () => {
  it('saves and reads the row back', async () => {
    mock.current.respond({ data: [{ id: 'f1' }] });
    await expect(updateById('fields', 'f1', { name: 'North' }, 'This field')).resolves.toBeNull();
    const [q] = mock.current.queries;
    expect(q.table).toBe('fields');
    expect(mock.current.argsOf(q, 'update')).toEqual([{ name: 'North' }]);
    expect(mock.current.argsOf(q, 'eq')).toEqual(['id', 'f1']);
    expect(mock.current.argsOf(q, 'select')).toEqual(['id']);
  });

  it('reports a change that row level security skipped', async () => {
    // A team viewer: no error, no rows.
    mock.current.respond({ data: [] });
    await expect(updateById('fields', 'f1', { name: 'North' }, 'This field')).resolves.toMatch(/^This field was not saved/);
  });

  it('passes on database errors', async () => {
    mock.current.respond({ error: { message: 'value too long' } });
    await expect(updateById('fields', 'f1', { name: 'North' })).resolves.toBe('value too long');
  });

  it('throws a NotSavedError when asked to', async () => {
    mock.current.respond({ data: [] });
    await expect(updateByIdOrThrow('tasks', 't1', { status: 'completed' }, 'This task')).rejects.toBeInstanceOf(NotSavedError);
  });
});
