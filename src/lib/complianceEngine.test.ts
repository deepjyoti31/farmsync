import { describe, expect, it } from 'vitest';
import { calculateReadiness, runAudit, validateBannedChemicals } from './complianceEngine';
import type { ComplianceRule } from '@/types/compliance';

const rule = (overrides: Partial<ComplianceRule>): ComplianceRule => ({
  id: 'r1',
  standard_id: 's1',
  category: 'Inputs',
  rule_description: 'No synthetic pesticides',
  validation_logic: { banned: ['Glyphosate', 'Atrazine'] },
  severity: 'critical',
  ...overrides,
});

describe('validateBannedChemicals', () => {
  it('matches case-insensitively, including brand names containing the ingredient', () => {
    expect(validateBannedChemicals(['Roundup (glyphosate 41%)', 'Neem oil'], rule({}))).toEqual([
      'Roundup (glyphosate 41%)',
    ]);
  });

  it('reports each offending product once', () => {
    expect(validateBannedChemicals(['Atrazine', 'Atrazine'], rule({}))).toEqual(['Atrazine']);
  });

  it('returns nothing when the rule has no banned list', () => {
    expect(validateBannedChemicals(['Glyphosate'], rule({ validation_logic: {} }))).toEqual([]);
  });
});

describe('runAudit', () => {
  it('passes, fails or defers each rule', () => {
    const rules = [
      rule({ id: 'banned' }),
      rule({ id: 'buffer', validation_logic: { min_buffer_meters: 10 } }),
    ];

    expect(runAudit(rules, ['Neem oil']).map((r) => [r.ruleId, r.status])).toEqual([
      ['banned', 'pass'],
      ['buffer', 'manual'],
    ]);

    const [banned] = runAudit(rules, ['Atrazine 50 WP']);
    expect(banned.status).toBe('fail');
    expect(banned.detail).toContain('Atrazine 50 WP');
  });
});

describe('calculateReadiness', () => {
  it('is the pass percentage, and 100 when nothing was checked', () => {
    expect(calculateReadiness({ passed: 3, failed: 1 })).toBe(75);
    expect(calculateReadiness({ passed: 0, failed: 0 })).toBe(100);
  });
});
