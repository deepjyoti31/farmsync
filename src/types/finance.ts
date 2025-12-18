
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'paid';
export type PolicyStatus = 'active' | 'expired';
export type ClaimStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected';
export type PaymentStatus = 'completed' | 'failed';

export interface Loan {
    id: string;
    farm_id: string;
    provider: string;
    amount: number;
    interest_rate: number;
    term_months: number;
    status: LoanStatus;
    created_at: string;
}

export interface InsurancePolicy {
    id: string;
    farm_id: string;
    provider: string;
    policy_number: string;
    coverage_type: string;
    premium_amount: number;
    coverage_amount: number;
    start_date: string;
    end_date: string;
    status: PolicyStatus;
}

export interface InsuranceClaim {
    id: string;
    policy_id: string;
    claim_date: string;
    reason: string;
    amount_requested: number;
    status: ClaimStatus;
    evidence?: string;
}

export interface Payment {
    id: string;
    user_id: string;
    transaction_type: 'loan_repayment' | 'premium' | 'input_purchase';
    amount: number;
    provider: 'stripe' | 'mpesa' | 'cash';
    status: PaymentStatus;
    reference_id?: string;
    created_at: string;
}

export interface FarmFinancialHealth {
    creditScore: number;
    maxLoanEligibility: number;
    totalDebt: number;
    activePolicies: number;
}
