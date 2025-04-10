
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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
  Filter, 
  CalendarRange, 
  ArrowUpDown,
  Sprout,
  CheckCircle2,
  Clock,
  Seedling,
  Scissors
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { crops, fields } from '@/data/mockData';

const Crops = () => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4 text-farm-yellow" />;
      case 'planted':
        return <Seedling className="h-4 w-4 text-farm-green" />;
      case 'growing':
        return <Sprout className="h-4 w-4 text-farm-lightGreen" />;
      case 'harvested':
        return <Scissors className="h-4 w-4 text-farm-brown" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-muted/40">Planned</Badge>;
      case 'planted':
        return <Badge variant="outline" className="bg-farm-green/10 text-farm-green border-farm-green/20">Planted</Badge>;
      case 'growing':
        return <Badge variant="outline" className="bg-farm-lightGreen/10 text-farm-lightGreen border-farm-lightGreen/20">Growing</Badge>;
      case 'harvested':
        return <Badge variant="outline" className="bg-farm-brown/10 text-farm-brown border-farm-brown/20">Harvested</Badge>;
      default:
        return null;
    }
  };

  const getFieldName = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : 'Unknown Field';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crop Management</h1>
          <p className="text-muted-foreground mt-1">
            Plan, track, and manage all your crops throughout their lifecycle.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Crop
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Crops</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Planting Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Harvest Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crops.map((crop) => (
                <TableRow key={crop.id}>
                  <TableCell className="font-medium">{crop.name}</TableCell>
                  <TableCell>{getFieldName(crop.fieldId)}</TableCell>
                  <TableCell>{crop.variety}</TableCell>
                  <TableCell>{formatDate(crop.plantingDate)}</TableCell>
                  <TableCell>{formatDate(crop.harvestDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(crop.status)}
                      {getStatusBadge(crop.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Crop Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12 text-center">
          <div className="max-w-sm">
            <CalendarRange className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Crop Calendar Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              Plan your sowing, irrigation, fertilization, and harvesting activities with our visual calendar.
            </p>
            <Button variant="outline">Check Back Soon</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Crops;
