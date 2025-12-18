
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateCreditScore, calculateLoanEligibility } from '@/lib/financialCalc';
import { Loader2, TrendingUp, Shield, CreditCard, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const FinanceHub = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [eligibility, setEligibility] = useState(0);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        // Simulate fetching data for calculation
        // In real app, we'd fetch actual harvest counts and transaction totals
        setTimeout(() => {
            const mockScore = calculateCreditScore(15, 25000); // Mock inputs
            setScore(mockScore);
            setEligibility(calculateLoanEligibility(mockScore));
            setLoading(false);
        }, 1000);
    };

    const getScoreColor = (s: number) => {
        if (s >= 750) return 'text-green-600';
        if (s >= 650) return 'text-blue-600';
        if (s >= 550) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Financial Services</h1>
                <p className="text-muted-foreground">Access credit, insurance, and manage payments.</p>
            </div>

            {/* Credit Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Farm Credit Score
                        </CardTitle>
                        <CardDescription>Based on production capabilities</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-6">
                        <div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div>
                        <p className="text-sm text-muted-foreground mt-2">Excellent</p>
                        <div className="mt-4 pt-4 border-t border-primary/10">
                            <p className="text-sm font-medium">Max Loan Eligibility</p>
                            <p className="text-2xl font-bold text-foreground">${eligibility.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <Link to="/dashboard/finance/loans" className="block h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-blue-500" />
                                Loans & Credit
                            </CardTitle>
                            <CardDescription>Manage active loans and apply for new credit</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full mt-4">View Loans</Button>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <Link to="/dashboard/finance/insurance" className="block h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-green-500" />
                                Insurance
                            </CardTitle>
                            <CardDescription>Protect your crops against weather risks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" className="w-full mt-4">View Policies</Button>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            No recent payments recorded.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinanceHub;
