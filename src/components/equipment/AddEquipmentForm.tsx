
import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { equipment as mockEquipment } from '@/data/mockData';

const equipmentSchema = z.object({
  name: z.string().min(2, { message: 'Equipment name is required' }),
  equipment_type: z.string().min(1, { message: 'Equipment type is required' }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.coerce.number().optional(),
  status: z.enum(['operational', 'needs maintenance', 'in repair', 'inactive']),
  last_maintenance_date: z.string().optional(),
  next_maintenance_date: z.string().optional(),
  notes: z.string().optional(),
  farm_id: z.string().min(1, { message: 'Farm is required' }),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

interface AddEquipmentFormProps {
  farmId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddEquipmentForm: React.FC<AddEquipmentFormProps> = ({ farmId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  
  const defaultValues: Partial<EquipmentFormValues> = {
    status: 'operational',
    farm_id: farmId || '',
    purchase_date: new Date().toISOString().split('T')[0],
  };

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });

  const onSubmit = async (data: EquipmentFormValues) => {
    try {
      // In a real app, this would be a Supabase call
      // For now, we'll add to mock data
      const newEquipment = {
        ...data,
        id: Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Ensure all required properties are set with non-optional values
        name: data.name,
        equipment_type: data.equipment_type,
        manufacturer: data.manufacturer || '',
        model: data.model || '',
        purchase_date: data.purchase_date || '',
        purchase_price: data.purchase_price || 0,
        status: data.status,
        last_maintenance_date: data.last_maintenance_date || '',
        next_maintenance_date: data.next_maintenance_date || '',
        notes: data.notes || '',
        farm_id: data.farm_id,
      };

      mockEquipment.push(newEquipment);
      
      toast({
        title: 'Equipment added successfully',
        description: `${data.name} has been added to your equipment list.`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: 'Failed to add equipment',
        description: 'There was an error adding your equipment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>Add New Equipment</DialogTitle>
        <DialogDescription>
          Add details about your farm equipment, machinery or tools.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Name</FormLabel>
                <FormControl>
                  <Input placeholder="Tractor, Sprayer, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="equipment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tractor">Tractor</SelectItem>
                      <SelectItem value="harvester">Harvester</SelectItem>
                      <SelectItem value="irrigation">Irrigation Equipment</SelectItem>
                      <SelectItem value="sprayer">Sprayer</SelectItem>
                      <SelectItem value="plow">Plow</SelectItem>
                      <SelectItem value="planter">Planter</SelectItem>
                      <SelectItem value="tool">Hand Tool</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="needs maintenance">Needs Maintenance</SelectItem>
                      <SelectItem value="in repair">In Repair</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input placeholder="Manufacturer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Model number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="last_maintenance_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Maintenance Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="next_maintenance_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Maintenance Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional information about this equipment" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Equipment</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default AddEquipmentForm;
