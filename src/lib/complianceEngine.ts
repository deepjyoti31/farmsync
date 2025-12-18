
import { ComplianceRule } from '@/types/compliance';

// Mock function to check if a chemical is allowed
// In real app, this would query the 'sustainability_logs' or 'crop_activities'
export const validateBannedChemicals = (usedChemicals: string[], rule: ComplianceRule): string[] => {
    const logic = rule.validation_logic as { banned?: string[] };
    if (!logic.banned) return [];

    return usedChemicals.filter(chem =>
        logic.banned?.includes(chem)
    );
};

export const calculateReadiness = (auditResults: { passed: number, failed: number }): number => {
    const total = auditResults.passed + auditResults.failed;
    if (total === 0) return 100;
    return Math.round((auditResults.passed / total) * 100);
};

export const runMockAudit = (rule: ComplianceRule) => {
    // Randomly fail 10% of time for demo
    const isClean = Math.random() > 0.1;
    if (isClean) return { status: 'pass' };
    return { status: 'fail', reason: 'Detected potential violation in recent logs.' };
};
