
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BULK_ORDER_STATUS_LABELS, effectiveBulkOrderStatus } from '@/lib/bulkOrders';
import { BulkOrder } from '@/types/coop';
import { ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';
import CreateCoopItemDialog from '@/components/coop/CreateCoopItemDialog';

const BulkOrdersList = () => {
    const { currentOrganization, userRole } = useAuth();
    const [orders, setOrders] = useState<BulkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    // Answers for a workspace the user has since switched away from are dropped,
    // so a slow reply can never show one team's data under another team's name.
    const orgIdRef = useRef(currentOrganization?.id);
    orgIdRef.current = currentOrganization?.id;

    useEffect(() => {
        if (currentOrganization) {
            loadOrders();
        } else {
            setLoading(false);
        }
    }, [currentOrganization]);

    const loadOrders = async () => {
        if (!currentOrganization) return;
        const orgId = currentOrganization.id;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bulk_orders')
                .select('*')
                .eq('organization_id', currentOrganization.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (orgIdRef.current !== orgId) return;
            setOrders(data as BulkOrder[]);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            if (orgIdRef.current === orgId) setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
              title="Bulk Orders"
              description={<>Manage group purchases for {currentOrganization?.name}</>}
              actions={
                <>
                  {(userRole === 'owner' || userRole === 'admin') && currentOrganization && (
                      <CreateCoopItemDialog kind="order" organizationId={currentOrganization.id} onCreated={loadOrders} />
                  )}
                </>
              }
            />

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No bulk orders yet</p>
                            <p className="text-muted-foreground">Start a group buy to save on inputs.</p>
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl">{order.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Deadline: {format(new Date(order.deadline), 'PPP')}
                                    </p>
                                </div>
                                {(() => {
                                    // Past its deadline an "open" order no longer takes commitments.
                                    const status = effectiveBulkOrderStatus(order);
                                    return (
                                        <Badge variant={status === 'open' ? 'default' : 'secondary'}>
                                            {BULK_ORDER_STATUS_LABELS[status]}
                                        </Badge>
                                    );
                                })()}
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BulkOrdersList;
