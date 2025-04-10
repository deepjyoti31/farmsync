
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from '@/components/ui/select';
import { Package, Search, Plus, FileDown, Filter, RefreshCcw, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import FarmSelector from '@/components/farms/FarmSelector';
import AddInventoryForm from '@/components/inventory/AddInventoryForm';

const Inventory = () => {
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch inventory categories
  const { 
    data: categories = [],
    isLoading: isCategoriesLoading
  } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch inventory items for the selected farm
  const { 
    data: inventory = [],
    isLoading: isInventoryLoading,
    error: inventoryError,
    refetch: refetchInventory
  } = useQuery({
    queryKey: ['inventory', selectedFarmId, searchQuery, categoryFilter],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      let query = supabase
        .from('inventory')
        .select(`
          *,
          category:category_id(id, name, type)
        `)
        .eq('farm_id', selectedFarmId);
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      // Apply category filter if selected
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFarmId,
  });

  // Handle errors
  React.useEffect(() => {
    if (inventoryError) {
      toast({
        title: 'Error loading inventory',
        description: (inventoryError as Error).message,
        variant: 'destructive',
      });
    }
  }, [inventoryError]);

  const getLowStockBadge = (item: any) => {
    if (item.minimum_stock && item.quantity <= item.minimum_stock) {
      return (
        <Badge variant="destructive" className="ml-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    return null;
  };

  const getExpiryBadge = (item: any) => {
    if (!item.expiry_date) return null;
    
    const today = new Date();
    const expiryDate = new Date(item.expiry_date);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Expired
        </Badge>
      );
    } else if (daysUntilExpiry < 30) {
      return (
        <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-700">
          Expires Soon
        </Badge>
      );
    }
    
    return null;
  };

  const handleAddInventorySuccess = () => {
    setDialogOpen(false);
    queryClient.invalidateQueries({queryKey: ['inventory']});
    toast({
      title: "Item added successfully",
      description: "Your inventory item has been added.",
    });
  };

  const isLoading = isInventoryLoading || isCategoriesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your farm supplies, equipment, and products
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
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              {selectedFarmId && (
                <AddInventoryForm 
                  farmId={selectedFarmId} 
                  onSuccess={handleAddInventorySuccess}
                  onCancel={() => setDialogOpen(false)}
                  categories={categories}
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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your farm supplies and equipment</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search items..."
                      className="pl-8 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => refetchInventory()}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inventory.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No inventory items found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || categoryFilter !== 'all' 
                      ? "Try changing your search or filter criteria."
                      : "Start adding items to track your inventory."}
                  </p>
                  {!(searchQuery || categoryFilter !== 'all') && (
                    <Button className="gap-2" onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add Your First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                            {getLowStockBadge(item)}
                            {getExpiryBadge(item)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.category?.name || 'Uncategorized'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.quantity} {item.unit || 'units'}
                          </TableCell>
                          <TableCell>{item.storage_location || '-'}</TableCell>
                          <TableCell>
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Details</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Inventory;
