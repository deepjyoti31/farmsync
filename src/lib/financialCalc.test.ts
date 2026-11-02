import { describe, expect, it } from 'vitest';
import {
  calculateCreditScore,
  calculateLoanEligibility,
  calculateMonthlyPayment,
  creditScoreLabel,
} from './financialCalc';

describe('calculateCreditScore', () => {
  it('starts at 300 with no history', () => {
    expect(calculateCreditScore(0, 0)).toBe(300);
  });

  it('caps the harvest and revenue bonuses and the overall score at 850', () => {
    expect(calculateCreditScore(1000, 10_000_000)).toBe(850);
    expect(calculateCreditScore(20, 0)).toBe(500);
  });

  it('ignores negative inputs', () => {
    expect(calculateCreditScore(-5, -1000)).toBe(300);
  });
});

describe('calculateLoanEligibility', () => {
  it.each([
    [499, 0],
    [550, 5000],
    [650, 15000],
    [720, 50000],
    [800, 100000],
  ])('score %i allows %i', (score, amount) => {
    expect(calculateLoanEligibility(score)).toBe(amount);
  });
});

describe('creditScoreLabel', () => {
  it('maps score bands to labels', () => {
    expect(creditScoreLabel(800)).toBe('Excellent');
    expect(creditScoreLabel(700)).toBe('Good');
    expect(creditScoreLabel(600)).toBe('Fair');
    expect(creditScoreLabel(400)).toBe('Building');
  });
});

describe('calculateMonthlyPayment', () => {
  it('matches the standard EMI formula', () => {
    // ₹1,00,000 at 12% p.a. over 12 months is ₹8,884.88 per month.
    expect(calculateMonthlyPayment(100000, 12, 12)).toBeCloseTo(8884.88, 2);
  });

  it('splits evenly at zero interest', () => {
    expect(calculateMonthlyPayment(1200, 0, 12)).toBe(100);
  });

  it('returns 0 for invalid input', () => {
    expect(calculateMonthlyPayment(0, 10, 12)).toBe(0);
    expect(calculateMonthlyPayment(1000, 10, 0)).toBe(0);
  });
});
