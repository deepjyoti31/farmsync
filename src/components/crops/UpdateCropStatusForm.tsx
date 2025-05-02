import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface UpdateCropStatusFormProps {
  cropId: string;
  currentStatus: string;
}

const UpdateCropStatusForm: React.FC<UpdateCropStatusFormProps> = ({
  cropId,
  currentStatus,
}) => {
  const [status, setStatus] = useState<string>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const handleSubmit = async () => {
    if (status === currentStatus) {
      toast({
        title: "No changes",
        description: "The status is already set to this value.",
      });
      return;
    }

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('field_crops')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', cropId);

      if (error) throw error;

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['field_crops'] });
      queryClient.invalidateQueries({ queryKey: ['crop-details', cropId] });

      toast({
        title: "Status updated",
        description: `Crop status has been updated to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message || "An error occurred while updating the status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-medium mb-1">Update Status</h3>
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="planted">Planted</SelectItem>
            <SelectItem value="growing">Growing</SelectItem>
            <SelectItem value="harvested">Harvested</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={handleSubmit} 
          disabled={isUpdating || status === currentStatus}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating
            </>
          ) : (
            'Update'
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateCropStatusForm;
