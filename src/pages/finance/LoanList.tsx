import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { calculateMonthlyPayment } from '@/lib/financialCalc';
import type { LoanStatus } from '@/types/finance';

const STATUS_VARIANT: Record<LoanStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    approved: 'default',
    active: 'default',
    paid: 'outline',
    rejected: 'destructive',
};

const formatMoney = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const LoanList = () => {
    // RLS limits this to loans on farms the user can access.
    const { data: loans = [], isLoading } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loans')
                .select('*, farm:farms(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });

    const outstanding = loans
        .filter((l) => l.status === 'active' || l.status === 'approved')
        .reduce((sum, l) => sum + Number(l.amount), 0);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Loans</h1>
                    <p className="text-muted-foreground">Manage your working capital</p>
                </div>
                <Button disabled title="Loan applications are coming soon">
                    <Plus className="h-4 w-4 mr-2" />
                    Apply for Loan
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : loans.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No loans recorded</p>
                        <p className="text-muted-foreground">Loans linked to your farms will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Outstanding principal (active and approved)</CardDescription>
                            <CardTitle className="text-3xl">{formatMoney(outstanding)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                        {loans.map((loan) => (
                            <Card key={loan.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg">{loan.provider}</CardTitle>
                                        <CardDescription>
                                            {loan.farm?.name ?? 'Farm'} · {loan.created_at ? format(new Date(loan.created_at), 'dd MMM yyyy') : ''}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={STATUS_VARIANT[(loan.status ?? 'pending') as LoanStatus]} className="capitalize">
                                        {loan.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">Amount</dt>
                                            <dd className="font-semibold">{formatMoney(Number(loan.amount))}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Interest</dt>
                                            <dd className="font-semibold">{Number(loan.interest_rate)}% p.a.</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Term</dt>
                                            <dd className="font-semibold">{loan.term_months} months</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Monthly payment</dt>
                                            <dd className="font-semibold">
                                                {formatMoney(calculateMonthlyPayment(Number(loan.amount), Number(loan.interest_rate), loan.term_months))}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LoanList;
