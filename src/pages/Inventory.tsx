
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
import { 
  Plus, 
  Package, 
  Loader2, 
  AlertCircle, 
  Search,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FarmSelector from '@/components/farms/FarmSelector';
import AddInventoryForm from '@/components/inventory/AddInventoryForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const Inventory = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch inventory for the selected farm
  const { 
    data: inventory = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['inventory', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          category:inventory_categories(*)
        `)
        .eq('farm_id', selectedFarmId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFarmId,
  });

  // Handle errors
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading inventory',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  }, [error]);

  const handleAddInventorySuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({queryKey: ['inventory']});
    toast({
      title: "Item added to inventory",
      description: "Your inventory has been updated.",
    });
  };

  // Filter inventory items by search term
  const filteredInventory = inventory.filter((item: any) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTermLower) ||
      (item.category?.name || '').toLowerCase().includes(searchTermLower) ||
      (item.storage_location || '').toLowerCase().includes(searchTermLower) ||
      (item.description || '').toLowerCase().includes(searchTermLower)
    );
  });

  // Get status badge for each inventory item
  const getStockStatusBadge = (item: any) => {
    if (!item.minimum_stock) return null;
    
    if (item.quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.quantity < item.minimum_stock) {
      return <Badge variant="warning" className="bg-farm-yellow text-black">Low Stock</Badge>;
    } else {
      return <Badge variant="outline" className="bg-farm-green/10 text-farm-green">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your farm inventory, supplies, and stock levels.
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
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              {selectedFarmId && (
                <AddInventoryForm 
                  farmId={selectedFarmId} 
                  onSuccess={handleAddInventorySuccess}
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
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Select a Farm</h3>
              <p className="text-muted-foreground mb-4">
                Please select a farm to view and manage your inventory.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Inventory Search & Filters</CardTitle>
                <div className="flex flex-1 max-w-md gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>Overview of all items in your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Items Added Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding items to track and manage your farm's inventory.
                  </p>
                  <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Your First Item
                  </Button>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Results Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search term to find what you're looking for.
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category?.name || '-'}</TableCell>
                        <TableCell>
                          {item.quantity} {item.unit || ''}
                        </TableCell>
                        <TableCell>{item.storage_location || '-'}</TableCell>
                        <TableCell>
                          {getStockStatusBadge(item)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Items that need restocking soon</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFarmId ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Select a farm to view low stock items.</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                {inventory.filter((item: any) => 
                  item.minimum_stock && item.quantity < item.minimum_stock
                ).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No low stock items at the moment.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {inventory.filter((item: any) => 
                      item.minimum_stock && item.quantity < item.minimum_stock
                    ).map((item: any) => (
                      <li key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} / {item.minimum_stock} {item.unit || ''}
                          </p>
                        </div>
                        <Badge variant="warning" className="bg-farm-yellow text-black">
                          Low Stock
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon</CardTitle>
            <CardDescription>Items that will expire in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedFarmId ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Select a farm to view expiring items.</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                {inventory.filter((item: any) => {
                  if (!item.expiry_date) return false;
                  const expiryDate = new Date(item.expiry_date);
                  const today = new Date();
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(today.getDate() + 30);
                  return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
                }).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No items expiring in the next 30 days.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {inventory.filter((item: any) => {
                      if (!item.expiry_date) return false;
                      const expiryDate = new Date(item.expiry_date);
                      const today = new Date();
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(today.getDate() + 30);
                      return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
                    }).map((item: any) => (
                      <li key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(item.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-farm-yellow/10 text-farm-yellow">
                          Expiring Soon
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;
