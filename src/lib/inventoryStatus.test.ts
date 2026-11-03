import { describe, expect, it } from 'vitest';
import { stockState, stockValue } from './inventoryStatus';

const today = new Date(2026, 10, 3);

describe('stockState', () => {
  it('flags low stock at or below the reorder level', () => {
    const s = stockState({ quantity: 2, minimum_stock: 5, expiry_date: null }, today);
    expect(s).toMatchObject({ low: true, out: false, needsAttention: true });
    expect(s.fill).toBe(20);
    expect(stockState({ quantity: 5, minimum_stock: 5, expiry_date: null }, today).low).toBe(true);
    expect(stockState({ quantity: 6, minimum_stock: 5, expiry_date: null }, today).low).toBe(false);
  });

  it('treats zero as out of stock, not low', () => {
    expect(stockState({ quantity: 0, minimum_stock: 5, expiry_date: null }, today)).toMatchObject({ out: true, low: false, fill: 0 });
  });

  it('reads expiry relative to today', () => {
    expect(stockState({ quantity: 10, minimum_stock: null, expiry_date: '2026-11-01' }, today).expiry).toBe('expired');
    expect(stockState({ quantity: 10, minimum_stock: null, expiry_date: '2026-11-20' }, today)).toMatchObject({ expiry: 'soon', daysToExpiry: 17 });
    expect(stockState({ quantity: 10, minimum_stock: null, expiry_date: '2027-06-01' }, today)).toMatchObject({ expiry: null, needsAttention: false, fill: 100 });
  });
});

describe('stockValue', () => {
  it('values only priced items', () => {
    expect(
      stockValue([
        { quantity: 4, minimum_stock: null, expiry_date: null, purchase_price: 266 },
        { quantity: 10, minimum_stock: null, expiry_date: null, purchase_price: null },
      ]),
    ).toBe(1064);
  });
});
