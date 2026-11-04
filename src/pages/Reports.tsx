
import { toDateValue } from '@/lib/dateRanges';
import React, { useState } from 'react';
import { transactionType, compactRupees } from '@/lib/financeSummary';
import { AXIS_PROPS, CHART, GRID_PROPS, categoryColor, foldCategories, TOOLTIP_PROPS } from '@/lib/chartPalette';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
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
import { Link } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getDateRange } from '@/lib/dateRanges';
import { downloadCsv, toCsv } from '@/lib/csv';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import PageHeader from '@/components/common/PageHeader';

const Reports = () => {
  // A transaction's own type wins, then its category's (the add form only sets the category).
  const typeOf = (t: { type?: string | null; financial_categories?: { type?: string | null } | null }) =>
    transactionType({ type: t.type, category: t.financial_categories });

  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('this-year');
  const [reportType, setReportType] = useState<string>('financial');
  
  // Financial transactions data query
  const { data: transactionsData = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['financial_transactions_reports', selectedFarmId, dateRange],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      // Get date range
      const { startDate, endDate } = getDateRange(dateRange);
      
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
      const date = parseISO(transaction.transaction_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0 };
      }
      
      const kind = typeOf(transaction);
      if (kind === 'income') monthlyData[monthYear].income += Number(transaction.amount) || 0;
      if (kind === 'expense') monthlyData[monthYear].expenses += Number(transaction.amount) || 0;
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
      const isExpense = typeOf(transaction) === 'expense';
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
  
  // Helper function to format month labels
  function formatMonthLabel(monthYear: string) {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  
  // Calculate summary stats
  const totalIncome = React.useMemo(() => {
    return transactionsData
      .filter(t => typeOf(t) === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactionsData]);
  
  const totalExpenses = React.useMemo(() => {
    return transactionsData
      .filter(t => typeOf(t) === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactionsData]);
  
  const netProfit = totalIncome - totalExpenses;

  // Empty statuses are left out so they don't draw 0% labels on the chart.
  const equipmentStatusData = [
    { name: 'Operational', status: 'operational', fill: '#2E7D4F' },
    { name: 'Needs Maintenance', status: 'needs maintenance', fill: '#E39B34' },
    { name: 'In Repair', status: 'in repair', fill: '#B4553A' },
    { name: 'Inactive', status: 'inactive', fill: CHART.other },
  ]
    .map((s) => ({ ...s, value: equipmentData.filter((e) => e.status === s.status).length }))
    .filter((s) => s.value > 0);
  
  // Colors for charts
  
  // Export the data behind the active report tab as CSV.
  const downloadReport = () => {
    const today = toDateValue(new Date());
    let csv: string | null = null;

    if (reportType === 'financial' && transactionsData.length > 0) {
      csv = toCsv(
        ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment method', 'Reference'],
        transactionsData.map((t) => [
          t.transaction_date,
          typeOf(t) ?? '',
          t.financial_categories?.name,
          t.description,
          t.amount,
          t.payment_method,
          t.reference_number,
        ]),
      );
    } else if (reportType === 'production' && fieldsData.length > 0) {
      csv = toCsv(
        ['Field', 'Area', 'Unit', 'Soil type', 'Soil pH'],
        fieldsData.map((f) => [f.name, f.area, f.area_unit, f.soil_type, f.soil_ph]),
      );
    } else if (reportType === 'equipment' && equipmentData.length > 0) {
      csv = toCsv(
        ['Name', 'Type', 'Manufacturer', 'Model', 'Status', 'Purchase date', 'Purchase price', 'Last maintenance', 'Next maintenance'],
        equipmentData.map((e) => [
          e.name, e.equipment_type, e.manufacturer, e.model, e.status,
          e.purchase_date, e.purchase_price, e.last_maintenance_date, e.next_maintenance_date,
        ]),
      );
    }

    if (!csv) {
      toast({ title: "Nothing to export", description: "There is no data for this report yet." });
      return;
    }
    downloadCsv(`farmsync-${reportType}-report-${today}.csv`, csv);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Reports"
        description="View and analyze your farm's performance data"
        actions={
          <>
            <FarmSelector
              selectedFarmId={selectedFarmId}
              onFarmChange={setSelectedFarmId}
            />
            <Button className="gap-2" onClick={downloadReport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />
      
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
                      <TrendingUp className="h-5 w-5 text-leaf mr-2" />
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
                      <TrendingUp className="h-5 w-5 text-destructive mr-2" />
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
                      <TrendingUp className="h-5 w-5 text-info mr-2" />
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
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis {...AXIS_PROPS} dataKey="month" />
                        <YAxis {...AXIS_PROPS} tickFormatter={compactRupees} width={60} />
                        <Tooltip {...TOOLTIP_PROPS} />
                        <Legend />
                        <Bar dataKey="income" name="Income" fill={CHART.income} />
                        <Bar dataKey="expenses" name="Expenses" fill={CHART.expense} />
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
                            data={foldCategories(expenseCategoryData, 'value', 'name')}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {foldCategories(expenseCategoryData, 'value', 'name').map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={categoryColor(index)} stroke="#FFFFFF" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip {...TOOLTIP_PROPS} formatter={(value) => `₹${value.toLocaleString()}`} />
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
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis {...AXIS_PROPS} dataKey="month" />
                          <YAxis {...AXIS_PROPS} tickFormatter={compactRupees} width={60} />
                          <Tooltip {...TOOLTIP_PROPS} formatter={(value) => `₹${value.toLocaleString()}`} />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            name="Profit/Loss"
                            stroke={CHART.single}
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
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis {...AXIS_PROPS} dataKey="name" />
                        <YAxis {...AXIS_PROPS} />
                        <Tooltip {...TOOLTIP_PROPS} />
                        <Legend />
                        <Bar dataKey="area" name="Area (acres)" fill={CHART.single} />
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
                  <Button asChild><Link to="/dashboard/analytics">View yield analysis</Link></Button>
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
                          data={equipmentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={150}
                          dataKey="value"
                        >
                          {/* Status colours: good, needs attention, out of action, not in use */}
                          {equipmentStatusData.map((d) => (
                            <Cell key={d.name} fill={d.fill} stroke="#FFFFFF" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP_PROPS} />
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
                  <Button asChild><Link to="/dashboard/equipment">View Maintenance Schedule</Link></Button>
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
                <Button variant="outline" className="justify-start h-auto py-4 px-4" onClick={() => setReportType('financial')}>
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Financial Summary</p>
                    <p className="text-sm text-muted-foreground">Income and expense details</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                  <Link to="/dashboard/analytics">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Crop Production</p>
                    <p className="text-sm text-muted-foreground">Yield and harvest statistics</p>
                  </div>
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4 px-4" onClick={() => setReportType('equipment')}>
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Equipment Usage</p>
                    <p className="text-sm text-muted-foreground">Maintenance and utilization</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4 px-4" onClick={() => setReportType('production')}>
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Field Analysis</p>
                    <p className="text-sm text-muted-foreground">Soil and productivity data</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4 px-4" asChild>
                  <Link to="/dashboard/inventory">
                  <FileText className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <p className="font-semibold">Inventory Status</p>
                    <p className="text-sm text-muted-foreground">Stock levels and usage</p>
                  </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;
