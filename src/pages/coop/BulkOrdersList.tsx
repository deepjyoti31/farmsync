
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BulkOrder } from '@/types/coop';
import { Plus, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';

const BulkOrdersList = () => {
    const { currentOrganization, userRole } = useAuth();
    const [orders, setOrders] = useState<BulkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentOrganization) {
            loadOrders();
        }
    }, [currentOrganization]);

    const loadOrders = async () => {
        if (!currentOrganization) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('bulk_orders')
                .select('*')
                .eq('organization_id', currentOrganization.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data as BulkOrder[]);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Bulk Orders</h1>
                    <p className="text-muted-foreground">Manage group purchases for {currentOrganization?.name}</p>
                </div>
                {(userRole === 'owner' || userRole === 'admin') && (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Order
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">No active bulk orders</p>
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
                                <Badge variant={order.status === 'open' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end">
                                    <Button variant="outline">View Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default BulkOrdersList;
