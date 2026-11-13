import { describe, expect, it } from 'vitest';
import { effectiveBulkOrderStatus } from './bulkOrders';

describe('effectiveBulkOrderStatus', () => {
  const now = new Date('2026-11-13T10:00:00Z');

  it('keeps an order open until its deadline', () => {
    expect(effectiveBulkOrderStatus({ status: 'open', deadline: '2026-11-13T18:29:59Z' }, now)).toBe('open');
  });

  it('closes an open order once the deadline has passed', () => {
    expect(effectiveBulkOrderStatus({ status: 'open', deadline: '2026-11-12T18:29:59Z' }, now)).toBe('closed');
    expect(effectiveBulkOrderStatus({ status: 'open', deadline: '2026-11-13T10:00:00Z' }, now)).toBe('closed');
  });

  it('treats a missing status as open', () => {
    expect(effectiveBulkOrderStatus({ status: null, deadline: '2026-11-01T00:00:00Z' }, now)).toBe('closed');
    expect(effectiveBulkOrderStatus({ status: null, deadline: '2026-12-01T00:00:00Z' }, now)).toBe('open');
  });

  it('leaves later stages alone', () => {
    expect(effectiveBulkOrderStatus({ status: 'ordered', deadline: '2026-11-01T00:00:00Z' }, now)).toBe('ordered');
    expect(effectiveBulkOrderStatus({ status: 'delivered', deadline: '2026-11-01T00:00:00Z' }, now)).toBe('delivered');
  });

  it('does not hide an order with an unreadable deadline', () => {
    expect(effectiveBulkOrderStatus({ status: 'open', deadline: 'not a date' }, now)).toBe('open');
  });
});
