/**
 * Indicative farm credit calculations.
 *
 * These figures are computed from the farm's own records in FarmSync and are a
 * guide only. They are not a credit bureau score and should not be presented
 * as a lending decision.
 */

/** Score in the familiar 300-850 range from harvest count and recorded income. */
export const calculateCreditScore = (totalHarvests: number, totalRevenue: number): number => {
    // Base score 300
    let score = 300;

    // Production consistency bonus
    score += Math.min(Math.max(totalHarvests, 0) * 10, 200);

    // Revenue stability bonus
    score += Math.min(Math.max(totalRevenue, 0) / 100, 350);

    return Math.min(Math.floor(score), 850);
};

export const calculateLoanEligibility = (creditScore: number): number => {
    if (creditScore < 500) return 0;
    if (creditScore < 600) return 5000;
    if (creditScore < 700) return 15000;
    if (creditScore < 750) return 50000;
    return 100000;
};

export const creditScoreLabel = (creditScore: number): string => {
    if (creditScore >= 750) return 'Excellent';
    if (creditScore >= 650) return 'Good';
    if (creditScore >= 550) return 'Fair';
    return 'Building';
};

/**
 * Equated monthly instalment for an amortising loan.
 * @param principal loan amount
 * @param annualRatePercent nominal annual interest rate, e.g. 7.5 for 7.5%
 * @param termMonths number of monthly payments
 */
export const calculateMonthlyPayment = (
    principal: number,
    annualRatePercent: number,
    termMonths: number,
): number => {
    if (principal <= 0 || termMonths <= 0) return 0;
    const r = annualRatePercent / 100 / 12;
    if (r === 0) return principal / termMonths;
    const factor = Math.pow(1 + r, termMonths);
    return (principal * r * factor) / (factor - 1);
};
