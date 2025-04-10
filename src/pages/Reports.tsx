
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
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';

const Reports = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('this-year');
  const [reportType, setReportType] = useState<string>('financial');
  
  // Financial transactions data query
  const { data: transactionsData = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['financial_transactions_reports', selectedFarmId, dateRange],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      // Get date range
      const { startDate, endDate } = getDateRangeFilter(dateRange);
      
      // Query financial transactions from Supabase
      const { data, error } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          financial_categories(name, type)
        `)
        .eq('farm_id', selectedFarmId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedFarmId && reportType === 'financial',
  });
  
  // Field data query
  const { data: fieldsData = [], isLoading: isLoadingFields } = useQuery({
    queryKey: ['fields_reports', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .eq('farm_id', selectedFarmId);
      
      if (error) {
        console.error('Error fetching fields:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedFarmId && reportType === 'production',
  });
  
  // Equipment data query
  const { data: equipmentData = [], isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment_reports', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('farm_id', selectedFarmId);
      
      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedFarmId && reportType === 'equipment',
  });
  
  // Process financial data for charts
  const financialChartData = React.useMemo(() => {
    if (!transactionsData || transactionsData.length === 0) return [];
    
    // Group by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    transactionsData.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0 };
      }
      
      const isIncome = transaction.financial_categories?.type === 'income';
      if (isIncome) {
        monthlyData[monthYear].income += Number(transaction.amount) || 0;
      } else {
        monthlyData[monthYear].expenses += Number(transaction.amount) || 0;
      }
    });
    
    // Convert to array for charts
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: formatMonthLabel(month),
      income: data.income,
      expenses: data.expenses,
      profit: data.income - data.expenses
    }));
  }, [transactionsData]);
  
  // Process expense category data for pie chart
  const expenseCategoryData = React.useMemo(() => {
    if (!transactionsData || transactionsData.length === 0) return [];
    
    const categoryTotals: Record<string, number> = {};
    
    transactionsData.forEach(transaction => {
      const isExpense = transaction.financial_categories?.type === 'expense';
      if (isExpense) {
        const categoryName = transaction.financial_categories?.name || 'Other';
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += Number(transaction.amount) || 0;
      }
    });
    
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    }));
  }, [transactionsData]);
  
  // Process field area data for charts
  const fieldAreaData = React.useMemo(() => {
    if (!fieldsData || fieldsData.length === 0) return [];
    
    return fieldsData.map(field => ({
      name: field.name,
      area: Number(field.area) || 0
    }));
  }, [fieldsData]);
  
  // Helper function to get date range
  function getDateRangeFilter(range: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let startDate = '';
    let endDate = now.toISOString().split('T')[0];
    
    switch (range) {
      case 'this-month':
        startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        break;
      case 'last-month':
        startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
        endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
        break;
      case 'this-quarter':
        const currentQuarter = Math.floor(currentMonth / 3);
        startDate = new Date(currentYear, currentQuarter * 3, 1).toISOString().split('T')[0];
        break;
      case 'last-quarter':
        const lastQuarter = (Math.floor(currentMonth / 3) - 1 + 4) % 4;
        const yearOfLastQuarter = lastQuarter > Math.floor(currentMonth / 3) ? currentYear - 1 : currentYear;
        startDate = new Date(yearOfLastQuarter, lastQuarter * 3, 1).toISOString().split('T')[0];
        endDate = new Date(lastQuarter === 3 ? currentYear : currentYear - 1, lastQuarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'this-year':
        startDate = `${currentYear}-01-01`;
        break;
      case 'last-year':
        startDate = `${currentYear - 1}-01-01`;
        endDate = `${currentYear - 1}-12-31`;
        break;
      default:
        startDate = `${currentYear}-01-01`;
    }
    
    return { startDate, endDate };
  }
  
  // Helper function to format month labels
  function formatMonthLabel(monthYear: string) {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  
  // Calculate summary stats
  const totalIncome = React.useMemo(() => {
    return transactionsData
      .filter(t => t.financial_categories?.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactionsData]);
  
  const totalExpenses = React.useMemo(() => {
    return transactionsData
      .filter(t => t.financial_categories?.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactionsData]);
  
  const netProfit = totalIncome - totalExpenses;
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const downloadReport = () => {
    toast({
      title: "Report Export",
      description: "Your report is being generated and will be available for download shortly.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Farm Reports</h1>
          <p className="text-muted-foreground mt-1">
            View and analyze your farm's performance data
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button className="gap-2" onClick={downloadReport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {!selectedFarmId ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Select a Farm</CardTitle>
          <CardDescription>
            Please select a farm to view its reports and analytics.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Tabs 
              value={reportType} 
              onValueChange={setReportType}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="last-quarter">Last Quarter</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {reportType === 'financial' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</span>
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
                      <TrendingUp className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</span>
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
                      <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold">₹{netProfit.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Income vs. Expenses</CardTitle>
                  <CardDescription>Monthly comparison over selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTransactions ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>Loading chart data...</p>
                    </div>
                  ) : financialChartData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>No transaction data available for the selected period.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={financialChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill="#10b981" />
                        <Bar dataKey="expenses" name="Expenses" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>By category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="h-60 flex items-center justify-center">
                        <p>Loading chart data...</p>
                      </div>
                    ) : expenseCategoryData.length === 0 ? (
                      <div className="h-60 flex items-center justify-center">
                        <p>No expense data available for the selected period.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={expenseCategoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expenseCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Profit Trend</CardTitle>
                    <CardDescription>Monthly profit/loss</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="h-60 flex items-center justify-center">
                        <p>Loading chart data...</p>
                      </div>
                    ) : financialChartData.length === 0 ? (
                      <div className="h-60 flex items-center justify-center">
                        <p>No profit data available for the selected period.</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={financialChartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            name="Profit/Loss"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {reportType === 'production' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Field Distribution</CardTitle>
                  <CardDescription>Area allocation by field</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFields ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>Loading field data...</p>
                    </div>
                  ) : fieldAreaData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>No field data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={fieldAreaData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="area" name="Area (acres)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Production Data</CardTitle>
                  <CardDescription>View detailed production reports</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <PieChartIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Crop Production Reports</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Track yields, growth patterns, and compare performance across different fields and seasons.
                  </p>
                  <Button>View Detailed Reports</Button>
                </CardContent>
              </Card>
            </>
          )}
          
          {reportType === 'equipment' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Status</CardTitle>
                  <CardDescription>Current equipment status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEquipment ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>Loading equipment data...</p>
                    </div>
                  ) : equipmentData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                      <p>No equipment data available.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Operational', value: equipmentData.filter(e => e.status === 'operational').length },
                            { name: 'Needs Maintenance', value: equipmentData.filter(e => e.status === 'needs maintenance').length },
                            { name: 'In Repair', value: equipmentData.filter(e => e.status === 'in repair').length },
                            { name: 'Inactive', value: equipmentData.filter(e => e.status === 'inactive').length },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Schedule</CardTitle>
                  <CardDescription>Upcoming equipment maintenance</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Equipment Maintenance</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Keep track of maintenance schedules and history for all your farm equipment.
                  </p>
                  <Button>View Maintenance Schedule</Button>
                </CardContent>
              </Card>
            </>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Financial Summary</p>
                    <p className="text-sm text-muted-foreground">Income and expense details</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Crop Production</p>
                    <p className="text-sm text-muted-foreground">Yield and harvest statistics</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Equipment Usage</p>
                    <p className="text-sm text-muted-foreground">Maintenance and utilization</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Field Analysis</p>
                    <p className="text-sm text-muted-foreground">Soil and productivity data</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Inventory Status</p>
                    <p className="text-sm text-muted-foreground">Stock levels and usage</p>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-4 px-4">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Tax Report</p>
                    <p className="text-sm text-muted-foreground">Annual tax summary</p>
                  </div>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Generate Custom Report</Button>
              <Button>Schedule Reports</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
