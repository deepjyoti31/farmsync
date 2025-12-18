
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Map as MapIcon, Package, ShoppingCart } from 'lucide-react';
import { CoopStats } from '@/types/coop';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CoopDashboard = () => {
    const { currentOrganization } = useAuth();
    const [stats, setStats] = useState<CoopStats>({ totalMembers: 0, totalArea: 0, activeBatches: 0, openOrders: 0 });
    const [loading, setLoading] = useState(true);
    const [cropDistribution, setCropDistribution] = useState<{ name: string, value: number }[]>([]);

    useEffect(() => {
        if (currentOrganization) {
            loadStats();
        }
    }, [currentOrganization]);

    const loadStats = async () => {
        if (!currentOrganization) return;
        setLoading(true);
        try {
            // 1. Members count
            const { count: memberCount } = await supabase
                .from('organization_members')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', currentOrganization.id);

            // 2. Total Area (Sum of all farms in the org)
            // Note: This requires the 'farms' table to have 'organization_id' populated via previous steps
            const { data: farms } = await supabase
                .from('farms')
                .select('total_area')
                .eq('organization_id', currentOrganization.id);

            const totalArea = farms?.reduce((sum, farm) => sum + (farm.total_area || 0), 0) || 0;

            // 3. Active Batches
            const { count: batchCount } = await supabase
                .from('produce_batches')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', currentOrganization.id)
                .neq('status', 'shipped');

            // 4. Open Orders
            const { count: orderCount } = await supabase
                .from('bulk_orders')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', currentOrganization.id)
                .eq('status', 'open');

            setStats({
                totalMembers: memberCount || 0,
                totalArea: totalArea,
                activeBatches: batchCount || 0,
                openOrders: orderCount || 0
            });

            // Dummy Distribution Data for chart (Real data would aggregate from field_crops)
            setCropDistribution([
                { name: 'Wheat', value: 400 },
                { name: 'Corn', value: 300 },
                { name: 'Soy', value: 300 },
                { name: 'Rice', value: 200 },
            ]);

        } catch (error) {
            console.error('Error loading coop stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Cooperative Dashboard</h1>
                <p className="text-muted-foreground">Overview for {currentOrganization?.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalMembers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Acreage</CardTitle>
                        <MapIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalArea.toFixed(1)} ha</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBatches}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Bulk Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.openOrders}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Crop Distribution</CardTitle>
                        <CardDescription>Estimated aggregate crop types across member farms</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={cropDistribution}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {cropDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>Latest updates from the cooperative</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No recent activities recorded.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CoopDashboard;
