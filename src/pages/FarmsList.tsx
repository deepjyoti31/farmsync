
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, VisuallyHidden, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Pencil, Trash2, Loader2, Info, Rows3 } from 'lucide-react';
import { format } from 'date-fns';
import AddFarmForm from '@/components/farms/AddFarmForm';
import EditFarmForm from '@/components/farms/EditFarmForm';
import FarmDetailsDialog from '@/components/farms/FarmDetailsDialog';
import AddFieldForm from '@/components/fields/AddFieldForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Farm } from '@/types';

const FarmsList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingFarmId, setViewingFarmId] = useState<string | null>(null);
  const [addingFieldForFarmId, setAddingFieldForFarmId] = useState<string | null>(null);

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleAddFarmSuccess = () => {
    setIsAddFarmOpen(false);
    queryClient.invalidateQueries({ queryKey: ['farms'] });
    toast({
      title: "Farm added",
      description: "Your farm has been successfully added.",
    });
  };

  const handleEditFarmSuccess = () => {
    setEditingFarm(null);
    queryClient.invalidateQueries({ queryKey: ['farms'] });
    toast({
      title: "Farm updated",
      description: "Your farm has been successfully updated.",
    });
  };

  const handleAddFieldSuccess = () => {
    setAddingFieldForFarmId(null);
    queryClient.invalidateQueries({ queryKey: ['fields'] });
    // Also invalidate farm-fields query for the farm details dialog
    if (addingFieldForFarmId) {
      queryClient.invalidateQueries({ queryKey: ['farm-fields', addingFieldForFarmId] });
    }
    toast({
      title: "Field added",
      description: "The field has been added successfully.",
    });
  };

  const handleDeleteFarm = async () => {
    if (!deletingFarm) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', deletingFarm.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({
        title: "Farm deleted",
        description: `${deletingFarm.name} has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the farm.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeletingFarm(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manage Farms</h1>
            <p className="text-muted-foreground">View, edit, and delete your farms</p>
          </div>
          <Button onClick={() => setIsAddFarmOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Farm
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Farms</CardTitle>
            <CardDescription>
              You have {farms.length} farm{farms.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : farms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">You don't have any farms yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddFarmOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Farm
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farms.map((farm) => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">
                          <button
                            onClick={() => setViewingFarmId(farm.id)}
                            className="hover:underline text-left font-medium text-primary focus:outline-none focus:underline"
                          >
                            {farm.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          {[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}
                        </TableCell>
                        <TableCell>
                          {farm.total_area ? `${farm.total_area} ${farm.area_unit || 'acres'}` : '-'}
                        </TableCell>
                        <TableCell>
                          {farm.created_at ? format(new Date(farm.created_at), 'PP') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingFarmId(farm.id)}
                              title="View Details"
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setAddingFieldForFarmId(farm.id)}
                              title="Add Field"
                            >
                              <Rows3 className="h-4 w-4" />
                              <span className="sr-only">Add Field</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingFarm(farm as unknown as Farm)}
                              title="Edit Farm"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingFarm(farm as unknown as Farm)}
                              title="Delete Farm"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Farm Dialog */}
      <Dialog open={isAddFarmOpen} onOpenChange={setIsAddFarmOpen}>
        <DialogContent className="p-0 max-w-4xl">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Add New Farm</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>Add a new farm to your account</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <AddFarmForm
            onClose={() => setIsAddFarmOpen(false)}
            onSuccess={handleAddFarmSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Farm Dialog */}
      <Dialog open={!!editingFarm} onOpenChange={(open) => !open && setEditingFarm(null)}>
        <DialogContent className="p-0 max-w-4xl">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Edit Farm</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>Edit existing farm details</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          {editingFarm && (
            <EditFarmForm
              farm={editingFarm}
              onClose={() => setEditingFarm(null)}
              onSuccess={handleEditFarmSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFarm} onOpenChange={(open) => !open && setDeletingFarm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the farm "{deletingFarm?.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFarm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Farm Details Dialog */}
      <FarmDetailsDialog
        farmId={viewingFarmId}
        isOpen={!!viewingFarmId}
        onClose={() => setViewingFarmId(null)}
      />

      {/* Add Field Dialog */}
      <Dialog open={!!addingFieldForFarmId} onOpenChange={(open) => !open && setAddingFieldForFarmId(null)}>
        <DialogContent className="p-0 max-w-md">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Add New Field</DialogTitle>
            <DialogDescription>
              Add a new field to your farm.
            </DialogDescription>
          </DialogHeader>
          {addingFieldForFarmId && (
            <AddFieldForm
              farmId={addingFieldForFarmId}
              onSuccess={handleAddFieldSuccess}
              onClose={() => setAddingFieldForFarmId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmsList;
