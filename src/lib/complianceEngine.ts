import { ComplianceRule } from '@/types/compliance';

export type RuleStatus = 'pass' | 'fail' | 'manual';

export interface RuleResult {
    ruleId: string;
    status: RuleStatus;
    /** Human-readable explanation of the result. */
    detail: string;
}

/**
 * Products from the input log that match a rule's banned list.
 * Matching is case-insensitive and also catches brand names that include the
 * active ingredient, e.g. "Roundup (glyphosate 41%)" matches "Glyphosate".
 */
export const validateBannedChemicals = (usedChemicals: string[], rule: ComplianceRule): string[] => {
    const logic = rule.validation_logic as { banned?: string[] } | null;
    if (!Array.isArray(logic?.banned)) return [];
    // A blank entry would match every product ("x".includes("") is true), so drop it.
    const banned = logic.banned
        .filter((b): b is string => typeof b === 'string')
        .map((b) => b.trim().toLowerCase())
        .filter(Boolean);
    if (banned.length === 0) return [];

    return Array.from(new Set(usedChemicals)).filter((chem) => {
        const name = (chem ?? '').toLowerCase();
        return name !== '' && banned.some((b) => name.includes(b));
    });
};

/**
 * Evaluate every rule of a standard against the farm's recorded input products.
 * Rules without automatable logic are returned as 'manual' rather than guessed.
 */
export const runAudit = (rules: ComplianceRule[], usedProducts: string[]): RuleResult[] =>
    rules.map((rule) => {
        const logic = rule.validation_logic as { banned?: string[] };
        if (Array.isArray(logic?.banned)) {
            const violations = validateBannedChemicals(usedProducts, rule);
            return violations.length > 0
                ? { ruleId: rule.id, status: 'fail', detail: `Banned inputs found in logs: ${violations.join(', ')}` }
                : { ruleId: rule.id, status: 'pass', detail: 'No banned inputs found in the input log.' };
        }
        return { ruleId: rule.id, status: 'manual', detail: 'Requires manual verification.' };
    });

export const calculateReadiness = (auditResults: { passed: number, failed: number }): number => {
    const total = auditResults.passed + auditResults.failed;
    if (total === 0) return 100;
    return Math.round((auditResults.passed / total) * 100);
};
