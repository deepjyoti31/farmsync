
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
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar,
  CreditCard,
  Landmark,
  PiggyBank,
  DollarSign,
  BarChart3,
  Filter 
} from 'lucide-react';
import FarmSelector from '@/components/farms/FarmSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialTransaction } from '@/types';
import { financialTransactions as mockTransactions } from '@/data/mockData';
import { Dialog } from '@/components/ui/dialog';
import AddTransactionForm from '@/components/finances/AddTransactionForm';

type TransactionFilterType = 'all' | 'income' | 'expense';
type DateRangeType = 'all' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year';

const Finances = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRangeType>('all');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['financial_transactions', selectedFarmId],
    queryFn: async () => {
      // In a real app, this would fetch from Supabase
      console.log('Fetching financial transactions');
      return mockTransactions;
    },
  });
  
  console.log('Current transactions:', transactions);

  // Apply filters
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by transaction type
    if (transactionFilter !== 'all' && transaction.type !== transactionFilter) {
      return false;
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      if (dateRange === 'this-month') {
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      } else if (dateRange === 'last-month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return transactionDate.getMonth() === lastMonth && 
               transactionDate.getFullYear() === lastMonthYear;
      } else if (dateRange === 'this-quarter') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
        return transactionQuarter === currentQuarter && 
               transactionDate.getFullYear() === currentYear;
      } else if (dateRange === 'this-year') {
        return transactionDate.getFullYear() === currentYear;
      }
    }
    
    return true;
  });

  // Calculate summary stats
  const incomeTotal = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseTotal = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = incomeTotal - expenseTotal;

  const handleAddTransaction = () => {
    setIsAddTransactionOpen(true);
  };

  const handleTransactionAdded = () => {
    setIsAddTransactionOpen(false);
    // Invalidate and refetch transactions data
    queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
  };

  // Type-safe handlers for Select components
  const handleTransactionFilterChange = (value: string) => {
    setTransactionFilter(value as TransactionFilterType);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value as DateRangeType);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Records</h1>
          <p className="text-muted-foreground mt-1">
            Track income and expenses for your farm operations.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button className="gap-2" onClick={handleAddTransaction}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {!selectedFarmId ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Select a Farm</CardTitle>
          <CardDescription>
            Please select a farm to view its financial records.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">₹{incomeTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-muted-foreground text-sm">
                  <span>From crop sales, subsidies, and other sources</span>
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
                  <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-2xl font-bold">₹{expenseTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-muted-foreground text-sm">
                  <span>For seeds, fertilizer, labor, and other costs</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {balance >= 0 ? (
                    <PiggyBank className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <Landmark className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className="text-2xl font-bold">₹{balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center mt-2 text-muted-foreground text-sm">
                  <span>Overall financial health of your farm</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">ROI: N/A</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">Profit Margin: N/A</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">Expense Ratio: N/A</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm">Tracking Since: N/A</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={handleTransactionFilterChange} defaultValue={transactionFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transactions</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={handleDateRangeChange} defaultValue={dateRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-quarter">This Quarter</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="text-right">
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No transactions found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Generate Report</Button>
              <Button>Export Data</Button>
            </CardFooter>
          </Card>
        </>
      )}

      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <AddTransactionForm 
          farmId={selectedFarmId} 
          onSuccess={handleTransactionAdded}
          onCancel={() => setIsAddTransactionOpen(false)}
        />
      </Dialog>
    </div>
  );
};

export default Finances;
