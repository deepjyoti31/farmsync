import { toDateValue } from '@/lib/dateRanges';
import { planCropStatusChange } from '@/lib/cropStatus';
import { errorMessage, updateByIdOrThrow } from '@/utils/deleteUtils';
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
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { HARVEST_UNITS } from '@/lib/yieldAnalytics';

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
  const [harvestQuantity, setHarvestQuantity] = useState('');
  const [harvestUnit, setHarvestUnit] = useState<string>('quintal');
  const isHarvesting = status === 'harvested' && currentStatus !== 'harvested';
  const queryClient = useQueryClient();

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  const handleSubmit = async () => {
    const plan = planCropStatusChange({
      currentStatus,
      status,
      harvestQuantity,
      harvestUnit,
      today: toDateValue(new Date()),
    });

    if ('reason' in plan) {
      toast(
        plan.reason === 'unchanged'
          ? { title: "No changes", description: "The status is already set to this value." }
          : {
              title: "Invalid quantity",
              description: "Enter a harvested quantity greater than zero, or leave it blank.",
              variant: "destructive",
            },
      );
      return;
    }

    try {
      setIsUpdating(true);

      await updateByIdOrThrow('field_crops', cropId, { ...plan.update, updated_at: new Date().toISOString() }, 'This planting');

      // Harvest records feed the yield charts in Analytics.
      if (plan.undoHarvest) {
        const { error: undoError } = await supabase.from('harvests').delete().eq('field_crop_id', cropId);
        if (undoError) throw undoError;
        queryClient.invalidateQueries({ queryKey: ['analytics_yield'] });
        queryClient.invalidateQueries({ queryKey: ['finance_hub_summary'] });
      }
      if (plan.harvest) {
        const { error: harvestError } = await supabase
          .from('harvests')
          .insert({ field_crop_id: cropId, ...plan.harvest });
        if (harvestError) throw harvestError;
        queryClient.invalidateQueries({ queryKey: ['analytics_yield'] });
      }

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['field_crops'] });
      queryClient.invalidateQueries({ queryKey: ['crop-details', cropId] });

      toast({
        title: "Status updated",
        description: `Crop status has been updated to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Error updating status",
        description: errorMessage(error, "An error occurred while updating the status."),
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
      {isHarvesting && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            placeholder="Quantity harvested"
            aria-label="Quantity harvested"
            className="w-[180px]"
            value={harvestQuantity}
            onChange={(e) => setHarvestQuantity(e.target.value)}
          />
          <Select value={harvestUnit} onValueChange={setHarvestUnit}>
            <SelectTrigger className="w-[120px]" aria-label="Harvest unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HARVEST_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default UpdateCropStatusForm;
