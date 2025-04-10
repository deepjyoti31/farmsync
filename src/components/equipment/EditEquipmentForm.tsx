
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Equipment } from '@/types';
import { cn } from '@/lib/utils';

interface EditEquipmentFormProps {
  equipment: Equipment;
  onSuccess: () => void;
  onCancel: () => void;
}

const equipmentStatusOptions = [
  { value: 'operational', label: 'Operational' },
  { value: 'needs maintenance', label: 'Needs Maintenance' },
  { value: 'in repair', label: 'In Repair' },
  { value: 'inactive', label: 'Inactive' },
];

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  equipment_type: z.string().min(1, "Equipment type is required"),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.date().optional(),
  purchase_price: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

const EditEquipmentForm: React.FC<EditEquipmentFormProps> = ({ equipment, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(
    equipment.purchase_date ? new Date(equipment.purchase_date) : undefined
  );

  // Convert numeric purchase price to string for the form
  const purchasePriceString = equipment.purchase_price ? 
    equipment.purchase_price.toString() : '';

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: equipment.name,
      equipment_type: equipment.equipment_type,
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      purchase_date: equipment.purchase_date ? new Date(equipment.purchase_date) : undefined,
      purchase_price: purchasePriceString,
      status: equipment.status,
      notes: equipment.notes || '',
    }
  });

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert string purchase price to numeric for storage
      const purchasePrice = data.purchase_price ? 
        parseFloat(data.purchase_price) : null;
      
      const { error } = await supabase
        .from('equipment')
        .update({
          name: data.name,
          equipment_type: data.equipment_type,
          manufacturer: data.manufacturer || null,
          model: data.model || null,
          purchase_date: data.purchase_date ? data.purchase_date.toISOString().split('T')[0] : null,
          purchase_price: purchasePrice,
          status: data.status,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', equipment.id);

      if (error) throw error;

      toast({
        title: "Equipment Updated",
        description: "The equipment has been updated successfully.",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[550px]">
      <DialogHeader>
        <DialogTitle>Edit Equipment</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Equipment Name*</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter equipment name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="equipment_type">Type*</Label>
            <Input
              id="equipment_type"
              {...register("equipment_type")}
              placeholder="Tractor, Harvester, etc."
            />
            {errors.equipment_type && (
              <p className="text-sm text-red-500">{errors.equipment_type.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              {...register("manufacturer")}
              placeholder="Manufacturer name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              {...register("model")}
              placeholder="Model number/name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? format(purchaseDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={(date) => {
                    setPurchaseDate(date);
                    setValue("purchase_date", date as Date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_price">Purchase Price (₹)</Label>
            <Input
              id="purchase_price"
              {...register("purchase_price")}
              placeholder="0.00"
              type="number"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status*</Label>
            <Select 
              defaultValue={equipment.status}
              onValueChange={(value) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {equipmentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            {...register("notes")}
            placeholder="Additional information about this equipment"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EditEquipmentForm;
