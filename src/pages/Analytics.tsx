import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Sprout } from 'lucide-react';
import FarmSelector from '@/components/farms/FarmSelector';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

            // Process for Charts
            const income = data.filter(t => t.category.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0);
            const expense = data.filter(t => t.category.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0);

            // Category Breakdown
            const categoryMap = new Map();
            data.filter(t => t.category.type === 'expense').forEach(t => {
                const catName = t.category.name;
                const current = categoryMap.get(catName) || 0;
                categoryMap.set(catName, current + Number(t.amount));
            });

            const expenseByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

            return { income, expense, expenseByCategory, transactions: data };
        },
        enabled: !!selectedFarmId
    });

    // Fetch Yield Data (Mocked for now as we just created the table and have no seed data)
    // In real implementation: join field_crops with harvests
    const mockYieldData = [
        { name: 'Wheat', yield: 45 },
        { name: 'Rice', yield: 62 },
        { name: 'Corn', yield: 38 },
        { name: 'Soybean', yield: 25 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
                    <p className="text-muted-foreground">Visualize your farm's performance and financial health.</p>
                </div>
                <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
            </div>

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
                                    <div className="text-2xl font-bold text-green-600">+₹{financialData?.income.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total recorded income</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">-₹{financialData?.expense.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Total recorded expenses</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                    {((financialData?.income || 0) - (financialData?.expense || 0)) > 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${((financialData?.income || 0) - (financialData?.expense || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                                                data={financialData?.expenseByCategory}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {financialData?.expenseByCategory.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
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
                                <CardDescription>Tonnes per hectare (Mock Data - Connect 'Harvests' table to populate)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={mockYieldData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="yield" fill="#10b981" name="Yield (Tons/Ha)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Analytics;
