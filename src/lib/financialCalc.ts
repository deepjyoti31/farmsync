
/**
 * Mock Financial Calculator
 * In a real app, this would query backend services or Credit Bureaus.
 */

export const calculateCreditScore = (totalHarvests: number, totalRevenue: number): number => {
    // Base score 300
    let score = 300;

    // Production consistency bonus
    score += Math.min(totalHarvests * 10, 200);

    // Revenue stability bonus
    score += Math.min(totalRevenue / 100, 350);

    return Math.min(Math.floor(score), 850);
};

export const calculateLoanEligibility = (creditScore: number): number => {
    if (creditScore < 500) return 0;
    if (creditScore < 600) return 5000;
    if (creditScore < 700) return 15000;
    if (creditScore < 750) return 50000;
    return 100000;
};
