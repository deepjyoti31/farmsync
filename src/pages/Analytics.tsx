import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { categoryTotals, compactRupees, totalOfType } from '@/lib/financeSummary';
import { AXIS_PROPS, CHART, GRID_PROPS, categoryColor, foldCategories, TOOLTIP_PROPS } from '@/lib/chartPalette';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Sprout } from 'lucide-react';
import FarmSelector from '@/components/farms/FarmSelector';
import { aggregateYieldByCrop, type HarvestRecord } from '@/lib/yieldAnalytics';
import PageHeader from '@/components/common/PageHeader';


const Analytics = () => {
    const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

    // Fetch Financial Data
    const { data: financialData, isLoading: isLoadingFinance } = useQuery({
        queryKey: ['analytics_finance', selectedFarmId],
        queryFn: async () => {
            if (!selectedFarmId) return null;

            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*, category:financial_categories(*)')
                .eq('farm_id', selectedFarmId);

            if (error) throw error;

            // Same rules as the Finances page: a transaction's own type wins, then its category's.
            const income = totalOfType(data, 'income');
            const expense = totalOfType(data, 'expense');
            const expenseByCategory = categoryTotals(data, 'expense').map(({ name, total }) => ({ name, value: total }));

            return { income, expense, expenseByCategory, transactions: data };
        },
        enabled: !!selectedFarmId
    });

    // Harvests for this farm, joined to their planting and field so yield per hectare can be computed.
    const { data: yieldData = [], isLoading: isLoadingYield } = useQuery({
        queryKey: ['analytics_yield', selectedFarmId],
        queryFn: async () => {
            if (!selectedFarmId) return [];

            const { data, error } = await supabase
                .from('harvests')
                .select('quantity, unit, revenue, field_crop_id, field_crops!inner(name, crops(name), fields!inner(farm_id, area, area_unit))')
                .eq('field_crops.fields.farm_id', selectedFarmId);

            if (error) throw error;

            const records: HarvestRecord[] = (data || []).map((h) => ({
                cropName: h.field_crops.crops?.name ?? h.field_crops.name ?? 'Unknown crop',
                quantity: Number(h.quantity),
                unit: h.unit,
                revenue: h.revenue,
                fieldCropId: h.field_crop_id,
                fieldArea: Number(h.field_crops.fields.area),
                fieldAreaUnit: h.field_crops.fields.area_unit,
            }));
            return aggregateYieldByCrop(records);
        },
        enabled: !!selectedFarmId
    });

    return (
        <div className="space-y-6">
            <PageHeader
              title="Analytics"
              description="Visualize your farm's performance and financial health."
              actions={
                <>
                  <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
                </>
              }
            />

            {!selectedFarmId ? (
                <Card>
                    <CardContent className="flex items-center justify-center p-12">
                        <p className="text-muted-foreground">Select a farm to view analytics.</p>
                    </CardContent>
                </Card>
            ) : isLoadingFinance ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : (
                <Tabs defaultValue="financial" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="financial">Financial Health</TabsTrigger>
                        <TabsTrigger value="yield">Yield Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-leaf">+₹{financialData?.income.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total recorded income</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">-₹{financialData?.expense.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total recorded expenses</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                    {((financialData?.income || 0) - (financialData?.expense || 0)) > 0 ? (
                                        <TrendingUp className="h-4 w-4 text-leaf" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-destructive" />
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${((financialData?.income || 0) - (financialData?.expense || 0)) >= 0 ? 'text-leaf' : 'text-destructive'}`}>
                                        ₹{((financialData?.income || 0) - (financialData?.expense || 0)).toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Income - Expenses</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <Card className="col-span-4">
                                <CardHeader>
                                    <CardTitle>Income vs Expenses</CardTitle>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={[
                                            { name: 'Income', amount: financialData?.income || 0 },
                                            { name: 'Expense', amount: financialData?.expense || 0 }
                                        ]}>
                                            <CartesianGrid {...GRID_PROPS} />
                                            <XAxis {...AXIS_PROPS} dataKey="name" />
                                            <YAxis {...AXIS_PROPS} tickFormatter={compactRupees} width={60} />
                                            <Tooltip {...TOOLTIP_PROPS} formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={96}>
                                                <Cell fill={CHART.income} />
                                                <Cell fill={CHART.expense} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                            <Card className="col-span-3">
                                <CardHeader>
                                    <CardTitle>Expense Breakdown</CardTitle>
                                    <CardDescription>Where is money being spent?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={foldCategories(financialData?.expenseByCategory ?? [], 'value', 'name')}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {foldCategories(financialData?.expenseByCategory ?? [], 'value', 'name').map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={categoryColor(index)} stroke="#FFFFFF" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip {...TOOLTIP_PROPS} formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="yield" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Crop Yield Performance</CardTitle>
                                <CardDescription>Tonnes per hectare, from recorded harvests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingYield ? (
                                    <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
                                ) : yieldData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                                        <Sprout className="h-10 w-10 text-muted-foreground/50" />
                                        <p className="font-medium">No harvests recorded yet</p>
                                        <p className="text-sm text-muted-foreground">
                                            Mark a crop as Harvested on the Crops page and enter the quantity to see yields here.
                                        </p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={yieldData}>
                                            <CartesianGrid {...GRID_PROPS} />
                                            <XAxis {...AXIS_PROPS} dataKey="name" />
                                            <YAxis {...AXIS_PROPS} />
                                            <Tooltip {...TOOLTIP_PROPS} />
                                            <Bar dataKey="yieldPerHectare" fill={CHART.single} name="Yield (t/ha)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Analytics;
