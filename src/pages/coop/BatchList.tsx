
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProduceBatch } from '@/types/coop';
import { Plus, Package } from 'lucide-react';
import { format } from 'date-fns';

const BatchList = () => {
    const { currentOrganization, userRole } = useAuth();
    const [batches, setBatches] = useState<ProduceBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentOrganization) {
            loadBatches();
        }
    }, [currentOrganization]);

    const loadBatches = async () => {
        if (!currentOrganization) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('produce_batches')
                .select('*')
                .eq('organization_id', currentOrganization.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBatches(data as ProduceBatch[]);
        } catch (error) {
            console.error('Error loading batches:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Produce Batches</h1>
                    <p className="text-muted-foreground">Track aggregated produce for {currentOrganization?.name}</p>
                </div>
                {(userRole === 'owner' || userRole === 'admin') && (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Batch
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : batches.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No active batches</p>
                            <p className="text-muted-foreground">Create a batch to aggregate member produce.</p>
                        </CardContent>
                    </Card>
                ) : (
                    batches.map((batch) => (
                        <Card key={batch.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{batch.batch_number}</CardTitle>
                                    <p className="text-sm font-medium">{batch.crop_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Created: {format(new Date(batch.created_at), 'PPP')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={batch.status === 'collecting' ? 'default' : 'secondary'} className="mb-2">
                                        {batch.status}
                                    </Badge>
                                    <p className="text-sm font-bold">{batch.total_quantity} kg</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end">
                                    <Button variant="outline">View Traceability</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BatchList;
