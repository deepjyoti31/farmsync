
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
import { Plus, Heart, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { livestock } from '@/data/mockData';

const Livestock = () => {
  const getHealthBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good':
        return <Badge className="bg-farm-green text-white">Good</Badge>;
      case 'average':
        return <Badge className="bg-farm-yellow text-black">Average</Badge>;
      case 'poor':
        return <Badge className="bg-destructive">Poor</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Livestock Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your farm animals, their health, and productivity.
          </p>
        </div>
        
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Livestock
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Livestock</CardTitle>
          <CardDescription>Overview of all animals on your farm</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Count</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>Health Status</span>
                  </div>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {livestock.map((animal) => (
                <TableRow key={animal.id}>
                  <TableCell className="font-medium">{animal.type}</TableCell>
                  <TableCell>{animal.breed}</TableCell>
                  <TableCell>{animal.count}</TableCell>
                  <TableCell>
                    {getHealthBadge(animal.healthStatus)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Health Tracking</CardTitle>
            <CardDescription>Monitor vaccinations and treatments</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-center">
            <div>
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Health Records Coming Soon</h3>
              <p className="text-muted-foreground">
                Track vaccinations, treatments, and health check-ups.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Production Data</CardTitle>
            <CardDescription>Track milk, eggs, or other products</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-center">
            <div>
              <ArrowUpDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Production Tracking Coming Soon</h3>
              <p className="text-muted-foreground">
                Monitor and analyze your livestock production.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Livestock;
