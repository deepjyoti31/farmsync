
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ProduceBatch } from '@/types/coop';
import { Package } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import CreateCoopItemDialog from '@/components/coop/CreateCoopItemDialog';

const BatchList = () => {
    const { currentOrganization, userRole } = useAuth();
    const [batches, setBatches] = useState<ProduceBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentOrganization) {
            loadBatches();
        } else {
            setLoading(false);
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
        <div className="space-y-6">
            <PageHeader
              title="Produce Batches"
              description={<>Track aggregated produce for {currentOrganization?.name}</>}
              actions={
                <>
                  {(userRole === 'owner' || userRole === 'admin') && currentOrganization && (
                      <CreateCoopItemDialog kind="batch" organizationId={currentOrganization.id} onCreated={loadBatches} />
                  )}
                </>
              }
            />

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
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BatchList;
