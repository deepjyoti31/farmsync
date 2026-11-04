
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog';
import AddFarmForm from './AddFarmForm';
import { toast } from '@/hooks/use-toast';

interface FarmSelectorProps {
  selectedFarmId: string | null;
  onFarmChange: (farmId: string) => void;
  showAddButtonWhenEmpty?: boolean;
}

const FarmSelector: React.FC<FarmSelectorProps> = ({
  selectedFarmId,
  onFarmChange,
  showAddButtonWhenEmpty = true
}) => {
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: farms = [], isLoading, error } = useQuery({
    // Each query shape needs its own key: components that share a key share one cache entry.
    queryKey: ['farms', 'selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farms')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
  });

  // Only set the first farm as selected if we have farms and no selection
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId && !isLoading) {
      onFarmChange(farms[0].id);
    }
  }, [farms, selectedFarmId, onFarmChange, isLoading]);

  const handleAddFarm = () => {
    setIsAddFarmOpen(true);
  };

  const handleFarmAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['farms'] });
    setIsAddFarmOpen(false);
  };

  const selectedFarm = farms.find(farm => farm.id === selectedFarmId);

  // Toast once per error, not on every render.
  React.useEffect(() => {
    if (!error) return;
    toast({
      title: 'Error',
      description: (error as Error).message || 'Failed to load farms.',
      variant: 'destructive',
    });
  }, [error]);

  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <Button variant="outline" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading farms...
        </Button>
      ) : farms.length === 0 ? (
        showAddButtonWhenEmpty ? (
          <Button onClick={handleAddFarm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Farm
          </Button>
        ) : null
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[200px] justify-between">
                {selectedFarm ? selectedFarm.name : 'Select a farm'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {farms.map((farm) => (
                <DropdownMenuItem
                  key={farm.id}
                  onClick={() => onFarmChange(farm.id)}
                >
                  {farm.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleAddFarm} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </>
      )}

      <Dialog open={isAddFarmOpen} onOpenChange={setIsAddFarmOpen}>
        <DialogContent className="p-0 max-w-4xl">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Add New Farm</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>
                Form to add a new farm configuration.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <AddFarmForm
            onClose={() => setIsAddFarmOpen(false)}
            onSuccess={handleFarmAdded}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmSelector;
