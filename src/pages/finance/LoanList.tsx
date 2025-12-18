
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Wallet } from 'lucide-react';
import { Loan } from '@/types/finance';
import { format } from 'date-fns';

const LoanList = () => {
    // Mock data for display - normally fetched from Supabase
    const [loans, setLoans] = useState<Loan[]>([]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Loans</h1>
                    <p className="text-muted-foreground">Manage your working capital</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Apply for Loan
                </Button>
            </div>

            <div className="grid gap-4">
                {loans.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No active loans</p>
                            <p className="text-muted-foreground">You are debt-free! Or check your eligibility to grow.</p>
                        </CardContent>
                    </Card>
                ) : (
                    loans.map(loan => (
                        <Card key={loan.id}>
                            <CardContent>Loan Item</CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default LoanList;
