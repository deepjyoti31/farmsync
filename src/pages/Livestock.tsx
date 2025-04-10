import React, { useState } from 'react';
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
import { Plus, Heart, ArrowUpDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import AddLivestockForm from '@/components/livestock/AddLivestockForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DeleteButton } from '@/components/common/DeleteConfirmation';
import { deleteEntity } from '@/utils/deleteUtils';

const Livestock = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { 
    data: livestock = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['livestock', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('livestock')
        .select(`
          *,
          livestock_type:livestock_types(*)
        `)
        .eq('farm_id', selectedFarmId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFarmId,
  });

  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading livestock',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error]);

  const getHealthBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-farm-green text-white">Active</Badge>;
      case 'sold':
        return <Badge className="bg-farm-yellow text-black">Sold</Badge>;
      case 'deceased':
        return <Badge className="bg-destructive">Deceased</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddLivestockSuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({queryKey: ['livestock']});
    toast({
      title: "Livestock added successfully",
      description: "Your livestock record has been added.",
    });
  };

  const handleDeleteLivestock = async (livestockId: string) => {
    await deleteEntity({
      id: livestockId,
      entityType: 'livestock',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['livestock'] });
      }
    });
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
        
        <div className="flex items-center gap-4">
          <FarmSelector
            selectedFarmId={selectedFarmId}
            onFarmChange={setSelectedFarmId}
          />
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!selectedFarmId}>
                <Plus className="h-4 w-4" />
                Add Livestock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Livestock</DialogTitle>
              </DialogHeader>
              {selectedFarmId && (
                <AddLivestockForm 
                  farmId={selectedFarmId} 
                  onSuccess={handleAddLivestockSuccess}
                  onCancel={() => setDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !selectedFarmId ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Farm</h3>
              <p className="text-muted-foreground mb-4">
                Please select a farm to view and manage your livestock.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : livestock.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12 text-center">
            <div className="max-w-sm">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Livestock Added Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding livestock to track and manage your farm's animals.
              </p>
              <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Livestock
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                  <TableHead>Tag ID</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>Status</span>
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestock.map((animal: any) => (
                  <TableRow key={animal.id}>
                    <TableCell className="font-medium">{animal.livestock_type?.name || 'Unknown'}</TableCell>
                    <TableCell>{animal.breed || '-'}</TableCell>
                    <TableCell>{animal.tag_id || '-'}</TableCell>
                    <TableCell className="capitalize">{animal.gender || 'Unknown'}</TableCell>
                    <TableCell>
                      {getHealthBadge(animal.status || 'active')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">Details</Button>
                        <DeleteButton 
                          onDelete={() => handleDeleteLivestock(animal.id)}
                          itemName={animal.tag_id || animal.livestock_type?.name}
                          entityType="Livestock"
                          buttonSize="sm"
                          buttonVariant="ghost"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
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
