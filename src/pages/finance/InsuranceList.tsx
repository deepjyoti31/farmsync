import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format } from 'date-fns';
import { Loader2, Plus, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const formatMoney = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const InsuranceList = () => {
    // RLS limits this to policies on farms the user can access.
    const { data: policies = [], isLoading } = useQuery({
        queryKey: ['insurance_policies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('insurance_policies')
                .select('*, farm:farms(name)')
                .order('end_date', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Insurance</h1>
                    <p className="text-muted-foreground">Risk protection for your farm</p>
                </div>
                <Button variant="outline" disabled title="Online quotes are coming soon">
                    <Plus className="h-4 w-4 mr-2" />
                    Get Coverage
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : policies.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No policies recorded</p>
                        <p className="text-muted-foreground">Protect your yield against climate risks.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {policies.map((policy) => {
                        const daysLeft = differenceInCalendarDays(new Date(policy.end_date), new Date());
                        const expired = policy.status === 'expired' || daysLeft < 0;
                        return (
                            <Card key={policy.id}>
                                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg">{policy.coverage_type}</CardTitle>
                                        <CardDescription>
                                            {policy.provider} · #{policy.policy_number} · {policy.farm?.name ?? 'Farm'}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={expired ? 'outline' : daysLeft <= 30 ? 'destructive' : 'default'}>
                                        {expired ? 'Expired' : daysLeft <= 30 ? `Renew in ${daysLeft}d` : 'Active'}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <dl className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">Coverage</dt>
                                            <dd className="font-semibold">{formatMoney(Number(policy.coverage_amount))}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Premium</dt>
                                            <dd className="font-semibold">{formatMoney(Number(policy.premium_amount))}</dd>
                                        </div>
                                        <div className="col-span-2">
                                            <dt className="text-muted-foreground">Period</dt>
                                            <dd className="font-semibold">
                                                {format(new Date(policy.start_date), 'dd MMM yyyy')} to {format(new Date(policy.end_date), 'dd MMM yyyy')}
                                            </dd>
                                        </div>
                                    </dl>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InsuranceList;
