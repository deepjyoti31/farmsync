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

describe('banned list hygiene', () => {
  it('ignores blank entries instead of flagging every product', () => {
    const r = rule({ validation_logic: { banned: ['', '  ', 'Paraquat'] } });
    expect(validateBannedChemicals(['Urea', 'Neem oil'], r)).toEqual([]);
    expect(validateBannedChemicals(['Gramoxone (paraquat)'], r)).toEqual(['Gramoxone (paraquat)']);
  });

  it('trims entries and ignores values that are not text', () => {
    const r = rule({ validation_logic: { banned: [' Atrazine ', 42, null] } });
    expect(validateBannedChemicals(['atrazine 50 WP'], r)).toEqual(['atrazine 50 WP']);
  });

  it('passes a rule whose banned list holds only blanks', () => {
    const [result] = runAudit([rule({ validation_logic: { banned: [''] } })], ['Urea']);
    expect(result.status).toBe('pass');
  });

  it('ignores blank product names in the input log', () => {
    expect(validateBannedChemicals(['', 'Glyphosate'], rule({}))).toEqual(['Glyphosate']);
  });

  it('handles rules without any validation logic', () => {
    expect(validateBannedChemicals(['Glyphosate'], rule({ validation_logic: null }))).toEqual([]);
    expect(runAudit([rule({ validation_logic: null })], ['Glyphosate'])[0].status).toBe('manual');
  });
});
