
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

const InsuranceList = () => {
    const [policies, setPolicies] = useState([]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Insurance</h1>
                    <p className="text-muted-foreground">Risk protection for your farm</p>
                </div>
                <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Get Coverage
                </Button>
            </div>

            <div className="grid gap-4">
                {policies.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No active policies</p>
                            <p className="text-muted-foreground">Protect your yield against climate risks.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div>Policies list here</div>
                )}
            </div>
        </div>
    );
};

export default InsuranceList;
