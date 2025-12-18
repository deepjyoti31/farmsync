
export type Severity = 'critical' | 'major' | 'minor';
export type SubscriptionStatus = 'active' | 'suspended';

export interface ComplianceStandard {
    id: string;
    name: string;
    description: string;
    version: string;
    authority: string;
}

export interface ComplianceRule {
    id: string;
    standard_id: string;
    category: string;
    rule_description: string;
    validation_logic: Record<string, any>; // Flexible JSON
    severity: Severity;
}

export interface FarmSubscription {
    id: string;
    farm_id: string;
    standard_id: string;
    status: SubscriptionStatus;
    start_date: string;
    progress?: number; // Calculated field for UI
}

export interface ComplianceAudit {
    id: string;
    farm_id: string;
    severity_score: number;
    generated_at: string;
    results: {
        passed: string[];
        failed: { rule_id: string; reason: string }[];
    };
}
