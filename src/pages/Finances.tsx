
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  IndianRupee,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { financialTransactions } from '@/data/mockData';
import { format } from 'date-fns';

const Finances = () => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const totalIncome = financialTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = financialTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-1">
            Track your farm's income, expenses, and overall financial health.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Record Expense
          </Button>
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Record Income
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 mr-1 text-farm-green" />
              <div className="text-2xl font-bold text-farm-green">{totalIncome.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 mr-1 text-destructive" />
              <div className="text-2xl font-bold text-destructive">{totalExpenses.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={netBalance >= 0 ? "bg-primary/5" : "bg-destructive/5"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 mr-1" className={netBalance >= 0 ? "text-farm-green" : "text-destructive"} />
              <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-farm-green" : "text-destructive"}`}>
                {Math.abs(netBalance).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Track all your financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={transaction.type === 'income' ? 'bg-farm-green/10 border-farm-green/20 text-farm-green' : 'bg-destructive/10 border-destructive/20 text-destructive'}>
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.paymentMethod}</TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end">
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-3 w-3 text-farm-green mr-1" />
                      ) : (
                        <ArrowDownCircle className="h-3 w-3 text-destructive mr-1" />
                      )}
                      <IndianRupee className="h-3 w-3 mr-1" />
                      <span className={transaction.type === 'income' ? 'text-farm-green' : 'text-destructive'}>
                        {transaction.amount.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-center border-t p-4">
          <Button variant="ghost">View All Transactions</Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>Analyze your farm's financial performance</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-center">
            <div>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Reports Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed financial reports and analysis will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Loans & Subsidies</CardTitle>
            <CardDescription>Track loans, subsidies, and financial aid</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-center">
            <div>
              <IndianRupee className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Loans & Subsidies Coming Soon</h3>
              <p className="text-muted-foreground">
                Track government schemes, loans, and financial assistance programs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Finances;
