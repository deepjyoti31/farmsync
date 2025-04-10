
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart, 
  PieChart, 
  Calendar, 
  Download,
  Filter,
  Loader2
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';

const INCOME_COLORS = ['#4CAF50', '#8BC34A', '#CDDC39', '#AFB42B'];
const EXPENSE_COLORS = ['#F44336', '#FF5722', '#FF9800', '#FFC107', '#9E9D24'];

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: { name: string; value: number; percent: number }[];
  expensesByCategory: { name: string; value: number; percent: number }[];
  monthlyData: { name: string; Income: number; Expenses: number }[];
  recentTransactions: any[];
}

const Finances = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('year'); // 'month', 'quarter', 'year'

  // Query to fetch financial transactions
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['finances', selectedFarmId, timeframe],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!selectedFarmId) {
        throw new Error('No farm selected');
      }

      // Fetch all financial transactions for the selected farm
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('farm_id', selectedFarmId)
        // Filter by timeframe here if needed
        .order('transaction_date', { ascending: false });
      
      if (error) {
        throw error;
      }

      const defaultResponse: FinancialSummary = {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        incomeByCategory: [],
        expensesByCategory: [],
        monthlyData: [],
        recentTransactions: []
      };

      if (!transactions || transactions.length === 0) {
        return defaultResponse;
      }

      // Process the data to calculate summary
      const incomeTransactions = transactions.filter(t => t.category.type === 'income');
      const expenseTransactions = transactions.filter(t => t.category.type === 'expense');
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Group by category
      const incomeByCategory = groupByCategory(incomeTransactions, totalIncome);
      const expensesByCategory = groupByCategory(expenseTransactions, totalExpenses);
      
      // Monthly data (simplified for the example)
      const monthlyData = generateMonthlyData(transactions);
      
      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        incomeByCategory,
        expensesByCategory,
        monthlyData,
        recentTransactions: transactions.slice(0, 10) // Take the 10 most recent transactions
      };
    },
    enabled: !!selectedFarmId,
  });

  // Helper function to group transactions by category
  const groupByCategory = (transactions: any[], total: number) => {
    const grouped = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Number(t.amount);
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: value as number,
      percent: Math.round(((value as number) / total) * 100)
    })).sort((a, b) => b.value - a.value);
  };

  // Helper function to generate monthly data for charts
  const generateMonthlyData = (transactions: any[]) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Group transactions by month
    const monthlyData = months.map(name => {
      return { name, Income: 0, Expenses: 0 };
    });
    
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthIndex = date.getMonth();
      
      if (t.category.type === 'income') {
        monthlyData[monthIndex].Income += Number(t.amount);
      } else {
        monthlyData[monthIndex].Expenses += Number(t.amount);
      }
    });
    
    return monthlyData;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-1">
            Track income, expenses, and manage your farm's financial health.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Select Period
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      {!financialData ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Select a Farm</CardTitle>
          <CardDescription>
            Please select a farm to view its financial data.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-farm-green mr-2" />
                  <span className="text-2xl font-bold">₹{financialData.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-farm-green text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>8% from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-destructive mr-2" />
                  <span className="text-2xl font-bold">₹{financialData.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-destructive text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  <span>5% from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-farm-yellow mr-2" />
                  <span className="text-2xl font-bold">₹{financialData.netProfit.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-farm-yellow text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Income vs. Expenses (2023)</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={financialData.monthlyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <RechartsBar dataKey="Income" fill="rgba(75, 192, 192, 0.5)" />
                    <RechartsBar dataKey="Expenses" fill="rgba(255, 99, 132, 0.5)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Top Income Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={financialData.incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${percent}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {financialData.incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {financialData.incomeByCategory.map((category) => (
                    <div className="flex justify-between items-center" key={category.name}>
                      <span>{category.name}</span>
                      <div className="flex items-center">
                        <span className="font-medium">₹{category.value.toLocaleString()}</span>
                        <span className="text-farm-green text-xs ml-2">({category.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Top Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={financialData.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${percent}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {financialData.expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {financialData.expensesByCategory.map((category) => (
                    <div className="flex justify-between items-center" key={category.name}>
                      <span>{category.name}</span>
                      <div className="flex items-center">
                        <span className="font-medium">₹{category.value.toLocaleString()}</span>
                        <span className="text-destructive text-xs ml-2">({category.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>View your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.category.name}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.payment_method}</TableCell>
                      <TableCell className={`text-right ${transaction.category.type === 'income' ? 'text-farm-green' : 'text-destructive'}`}>
                        {transaction.category.type === 'income' ? '+' : '-'}₹{Number(transaction.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline">View All Transactions</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default Finances;
