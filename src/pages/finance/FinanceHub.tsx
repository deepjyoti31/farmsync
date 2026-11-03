
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateCreditScore, calculateLoanEligibility, creditScoreLabel } from '@/lib/financialCalc';
import { totalOfType } from '@/lib/financeSummary';
import { Loader2, TrendingUp, Shield, CreditCard, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';

const FinanceHub = () => {
    const { user } = useAuth();

    // Indicative score from the user's own records: harvest count and recorded income.
    const { data: summary, isLoading: loading } = useQuery({
        queryKey: ['finance_hub_summary', user?.id],
        queryFn: async () => {
            const [harvests, transactions, payments] = await Promise.all([
                supabase.from('harvests').select('id', { count: 'exact', head: true }),
                // The add-transaction form sets only category_id, so the type may live on the category.
                // Fetch both and classify client-side rather than filtering on financial_transactions.type.
                supabase.from('financial_transactions').select('amount, type, category:financial_categories(type)'),
                supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(5),
            ]);
            if (harvests.error) throw harvests.error;
            if (transactions.error) throw transactions.error;
            if (payments.error) throw payments.error;

            const totalRevenue = totalOfType(transactions.data || [], 'income');
            const score = calculateCreditScore(harvests.count ?? 0, totalRevenue);
            return {
                score,
                eligibility: calculateLoanEligibility(score),
                payments: payments.data || [],
            };
        },
        enabled: !!user,
    });
    const score = summary?.score ?? 0;
    const eligibility = summary?.eligibility ?? 0;

    const getScoreColor = (s: number) => {
        if (s >= 750) return 'text-leaf';
        if (s >= 650) return 'text-info';
        if (s >= 550) return 'text-warning';
        return 'text-destructive';
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader
              title="Financial Services"
              description="Access credit, insurance, and manage payments."
            />

            {/* Credit Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Farm Credit Score
                        </CardTitle>
                        <CardDescription>Indicative, based on your recorded harvests and income</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-6">
                        <div className={`text-6xl font-bold ${getScoreColor(score)}`}>{score}</div>
                        <p className="text-sm text-muted-foreground mt-2">{creditScoreLabel(score)}</p>
                        <div className="mt-4 pt-4 border-t border-primary/10">
                            <p className="text-sm font-medium">Max Loan Eligibility</p>
                            <p className="text-2xl font-bold text-foreground">₹{eligibility.toLocaleString('en-IN')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <Link to="/dashboard/finance/loans" className="block h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-info" />
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
                                <Shield className="h-5 w-5 text-leaf" />
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
                        <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {summary?.payments.length ? (
                            <ul className="divide-y">
                                {summary.payments.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                                        <div>
                                            <p className="font-medium capitalize">{(p.transaction_type ?? 'payment').replace(/_/g, ' ')}</p>
                                            <p className="text-muted-foreground">
                                                {p.created_at ? format(new Date(p.created_at), 'dd MMM yyyy') : ''} · {p.provider}
                                            </p>
                                        </div>
                                        <span className={p.status === 'failed' ? 'text-destructive' : 'font-semibold'}>
                                            ₹{Number(p.amount).toLocaleString('en-IN')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent payments recorded.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinanceHub;
