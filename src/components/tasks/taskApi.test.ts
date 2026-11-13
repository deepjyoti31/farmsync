import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '@/test/supabaseMock';

const { mock } = vi.hoisted(() => ({ mock: { current: null as unknown as ReturnType<typeof createSupabaseMock> } }));
vi.mock('@/integrations/supabase/client', () => ({
  get supabase() {
    return mock.current.client;
  },
}));
mock.current = createSupabaseMock();

import { setTaskCompleted, setTaskStatus, type TaskRow } from './taskApi';

const task = (overrides: Partial<TaskRow> = {}): TaskRow =>
  ({
    id: 't1',
    farm_id: 'farm-1',
    title: 'Feed calves',
    description: 'Morning feed',
    priority: 'high',
    task_type: 'livestock',
    related_id: null,
    assigned_to: 'u1',
    recurrence: 'weekly',
    due_date: '2026-11-05',
    status: 'pending',
    completed_at: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    ...overrides,
  }) as TaskRow;

/** The status update reads the row back to prove it was saved. */
const SAVED = { data: [{ id: 't1' }] };

beforeEach(() => mock.current.reset());

describe('setTaskCompleted', () => {
  it('reports a change the database skipped instead of moving the series on', async () => {
    // A team viewer's update matches no rows and returns no error.
    mock.current.respond({ data: [] });
    await expect(setTaskCompleted(task(), true)).rejects.toThrow(/was not saved/);
    expect(mock.current.queries).toHaveLength(1);
  });

  it('completes a one-off task without creating another', async () => {
    mock.current.respond(SAVED);
    await expect(setTaskCompleted(task({ recurrence: 'none' }), true)).resolves.toBeNull();

    expect(mock.current.queries).toHaveLength(1);
    const [update] = mock.current.queries;
    const values = mock.current.argsOf(update, 'update')![0] as Record<string, unknown>;
    expect(values.status).toBe('completed');
    expect(typeof values.completed_at).toBe('string');
    expect(mock.current.argsOf(update, 'eq')).toEqual(['id', 't1']);
  });

  it('creates the next occurrence of a repeating task', async () => {
    mock.current.respond(SAVED, { data: [] }, {});
    await expect(setTaskCompleted(task(), true)).resolves.toBe('2026-11-12');

    const [, lookup, insert] = mock.current.queries;
    expect(lookup.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toEqual([
      ['farm_id', 'farm-1'],
      ['title', 'Feed calves'],
      ['recurrence', 'weekly'],
      ['due_date', '2026-11-12'],
    ]);
    expect(mock.current.argsOf(insert, 'insert')![0]).toEqual({
      farm_id: 'farm-1',
      title: 'Feed calves',
      description: 'Morning feed',
      priority: 'high',
      task_type: 'livestock',
      related_id: null,
      assigned_to: 'u1',
      recurrence: 'weekly',
      due_date: '2026-11-12',
      status: 'pending',
    });
  });

  it('does not create the next occurrence twice when re-ticked', async () => {
    mock.current.respond(SAVED, { data: [{ id: 't2' }] });
    await expect(setTaskCompleted(task({ recurrence: 'monthly', due_date: '2026-01-31' }), true)).resolves.toBe('2026-02-28');
    expect(mock.current.queries).toHaveLength(2);
  });

  it('remembers the day of the month when a short month moves the next occurrence', async () => {
    mock.current.respond(SAVED, { data: [] }, {});
    await expect(setTaskCompleted(task({ recurrence: 'monthly', due_date: '2026-01-31' }), true)).resolves.toBe('2026-02-28');
    expect(mock.current.argsOf(mock.current.queries[2], 'insert')![0]).toMatchObject({ due_date: '2026-02-28', recurrence_day: 31 });
  });

  it('goes back to the remembered day in the next long month', async () => {
    mock.current.respond(SAVED, { data: [] }, {});
    const feb = task({ recurrence: 'monthly', due_date: '2026-02-28', recurrence_day: 31 });
    await expect(setTaskCompleted(feb, true)).resolves.toBe('2026-03-31');
    // Back on the 31st, so nothing needs remembering.
    expect(mock.current.argsOf(mock.current.queries[2], 'insert')![0]).not.toHaveProperty('recurrence_day');
  });

  it('still creates the next occurrence on a database without the recurrence_day column', async () => {
    mock.current.respond(SAVED, { data: [] }, { error: { code: 'PGRST204', message: 'no such column' } }, {});
    await expect(setTaskCompleted(task({ recurrence: 'monthly', due_date: '2026-01-31' }), true)).resolves.toBe('2026-02-28');
    expect(mock.current.queries).toHaveLength(4);
    expect(mock.current.argsOf(mock.current.queries[3], 'insert')![0]).not.toHaveProperty('recurrence_day');
  });

  it('does nothing more for a task that was already done', async () => {
    mock.current.respond(SAVED);
    await expect(setTaskCompleted(task({ status: 'completed' }), true)).resolves.toBeNull();
    expect(mock.current.queries).toHaveLength(1);
  });

  it('reopens a task and clears its completion time', async () => {
    mock.current.respond(SAVED);
    await expect(setTaskCompleted(task({ status: 'completed' }), false)).resolves.toBeNull();
    const values = mock.current.argsOf(mock.current.queries[0], 'update')![0];
    expect(values).toEqual({ status: 'pending', completed_at: null });
  });

  it('needs a due date to repeat', async () => {
    mock.current.respond(SAVED);
    await expect(setTaskCompleted(task({ due_date: null }), true)).resolves.toBeNull();
    expect(mock.current.queries).toHaveLength(1);
  });

  it('looks up with recurrence "none" when the task has none set', async () => {
    // A null recurrence never repeats, so no lookup is made at all.
    mock.current.respond(SAVED);
    await expect(setTaskCompleted(task({ recurrence: null }), true)).resolves.toBeNull();
    expect(mock.current.queries).toHaveLength(1);
  });

  it('throws the update, lookup and insert errors', async () => {
    mock.current.respond({ error: { message: 'update failed' } });
    await expect(setTaskCompleted(task(), true)).rejects.toThrow('update failed');

    mock.current.respond(SAVED, { error: { message: 'lookup failed' } });
    await expect(setTaskCompleted(task(), true)).rejects.toEqual({ message: 'lookup failed' });

    mock.current.respond(SAVED, { data: [] }, { error: { message: 'insert failed' } });
    await expect(setTaskCompleted(task(), true)).rejects.toEqual({ message: 'insert failed' });
  });
});

describe('setTaskStatus', () => {
  it('moves a task to a board column and clears its completion time', async () => {
    mock.current.respond(SAVED);
    await setTaskStatus(task({ status: 'completed' }), 'in_progress');
    const values = mock.current.argsOf(mock.current.queries[0], 'update')![0];
    expect(values).toEqual({ status: 'in_progress', completed_at: null });
  });

  it('throws when the update fails', async () => {
    mock.current.respond({ error: { message: 'denied' } });
    await expect(setTaskStatus(task(), 'pending')).rejects.toThrow('denied');
  });
});
