
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  Download 
} from 'lucide-react';
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
};

const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const data = {
  labels,
  datasets: [
    {
      label: 'Income',
      data: [20000, 32000, 28000, 42000, 35000, 48000],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
    {
      label: 'Expenses',
      data: [15000, 21000, 18000, 25000, 22000, 30000],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

const Finances = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-1">
            Track income, expenses, and manage your farm's financial health.
          </p>
        </div>
        
        <div className="flex gap-2">
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
              <span className="text-2xl font-bold">₹2,05,000</span>
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
              <span className="text-2xl font-bold">₹1,31,000</span>
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
              <span className="text-2xl font-bold">₹74,000</span>
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
            <Bar options={options} data={data} />
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Wheat</span>
                <div className="flex items-center">
                  <span className="font-medium">₹85,000</span>
                  <span className="text-farm-green text-xs ml-2">(41%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Rice</span>
                <div className="flex items-center">
                  <span className="font-medium">₹65,000</span>
                  <span className="text-farm-green text-xs ml-2">(32%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Vegetables</span>
                <div className="flex items-center">
                  <span className="font-medium">₹35,000</span>
                  <span className="text-farm-green text-xs ml-2">(17%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Dairy</span>
                <div className="flex items-center">
                  <span className="font-medium">₹20,000</span>
                  <span className="text-farm-green text-xs ml-2">(10%)</span>
                </div>
              </div>
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Fertilizers</span>
                <div className="flex items-center">
                  <span className="font-medium">₹45,000</span>
                  <span className="text-destructive text-xs ml-2">(34%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Seeds</span>
                <div className="flex items-center">
                  <span className="font-medium">₹30,000</span>
                  <span className="text-destructive text-xs ml-2">(23%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Labor</span>
                <div className="flex items-center">
                  <span className="font-medium">₹28,000</span>
                  <span className="text-destructive text-xs ml-2">(21%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Equipment</span>
                <div className="flex items-center">
                  <span className="font-medium">₹18,000</span>
                  <span className="text-destructive text-xs ml-2">(14%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Others</span>
                <div className="flex items-center">
                  <span className="font-medium">₹10,000</span>
                  <span className="text-destructive text-xs ml-2">(8%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Finances;
