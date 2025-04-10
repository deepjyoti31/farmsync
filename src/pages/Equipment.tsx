
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
  Tractor,
  Wrench,
  Calendar,
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  Settings,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FarmSelector from '@/components/farms/FarmSelector';
import { Equipment, EquipmentMaintenance } from '@/types';

const EquipmentPage = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'maintenance'>('all');

  // Fetch equipment data
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];

      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('farm_id', selectedFarmId);

        if (error) throw error;
        return data as Equipment[];
      } catch (error) {
        console.error('Error fetching equipment:', error);
        toast({
          title: "Failed to fetch equipment",
          description: "Could not retrieve equipment data.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedFarmId,
  });

  // Fetch maintenance records
  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['equipment_maintenance', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];

      try {
        // First get equipment IDs for this farm
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select('id')
          .eq('farm_id', selectedFarmId);

        if (!equipmentData || equipmentData.length === 0) return [];

        const equipmentIds = equipmentData.map(item => item.id);

        // Then get maintenance records for these equipment
        const { data, error } = await supabase
          .from('equipment_maintenance')
          .select(`
            *,
            equipment:equipment_id(name)
          `)
          .in('equipment_id', equipmentIds)
          .order('maintenance_date', { ascending: false });

        if (error) throw error;
        return data as EquipmentMaintenance[];
      } catch (error) {
        console.error('Error fetching maintenance records:', error);
        toast({
          title: "Failed to fetch maintenance records",
          description: "Could not retrieve maintenance data.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedFarmId,
  });

  // Calculate statistics
  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    maintenance: equipment.filter(e => e.status === 'needs maintenance').length,
    repair: equipment.filter(e => e.status === 'in repair').length,
    inactive: equipment.filter(e => e.status === 'inactive').length,
    totalValue: equipment.reduce((sum, e) => sum + (e.purchase_price || 0), 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'needs maintenance':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'in repair':
        return <Wrench className="h-5 w-5 text-blue-500" />;
      case 'inactive':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
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
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your farm equipment and schedule maintenance.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>
      
      {!selectedFarmId ? (
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Select a Farm</CardTitle>
          <CardDescription>
            Please select a farm to view its equipment.
          </CardDescription>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Tractor className="h-5 w-5 text-primary mr-2" />
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <div className="flex items-center mt-2 text-muted-foreground text-sm">
                  <span>Total value: ₹{stats.totalValue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operational
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.operational}</span>
                </div>
                <div className="flex items-center mt-2 text-green-500 text-sm">
                  <span>{stats.total ? Math.round((stats.operational / stats.total) * 100) : 0}% of equipment</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.maintenance}</span>
                </div>
                <div className="flex items-center mt-2 text-amber-500 text-sm">
                  <span>{stats.total ? Math.round((stats.maintenance / stats.total) * 100) : 0}% of equipment</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Repair
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Wrench className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-2xl font-bold">{stats.repair}</span>
                </div>
                <div className="flex items-center mt-2 text-blue-500 text-sm">
                  <span>{stats.total ? Math.round((stats.repair / stats.total) * 100) : 0}% of equipment</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Equipment List</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant={activeTab === 'all' ? 'default' : 'outline'} 
                    onClick={() => setActiveTab('all')}
                    size="sm"
                  >
                    All Equipment
                  </Button>
                  <Button 
                    variant={activeTab === 'maintenance' ? 'default' : 'outline'} 
                    onClick={() => setActiveTab('maintenance')}
                    size="sm"
                  >
                    Maintenance Records
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'all' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer/Model</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No equipment found. Add your first equipment to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipment.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.equipment_type}</TableCell>
                          <TableCell>{item.manufacturer} {item.model}</TableCell>
                          <TableCell>{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <span>{item.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No maintenance records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.equipment?.name || 'Unknown'}</TableCell>
                          <TableCell>{new Date(record.maintenance_date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.maintenance_type}</TableCell>
                          <TableCell>{record.performed_by || 'Not specified'}</TableCell>
                          <TableCell className="text-right">₹{Number(record.cost || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {equipment.length > 0 && (
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button variant="outline">Generate Report</Button>
              </CardFooter>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default EquipmentPage;
