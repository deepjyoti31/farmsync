
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldFormData } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const fieldFormSchema = z.object({
  name: z.string().min(2, { message: 'Field name must be at least 2 characters' }),
  area: z.coerce.number().positive({ message: 'Area must be a positive number' }),
  areaUnit: z.string().default('acres'),
  location: z.string().min(2, { message: 'Location must be at least 2 characters' }),
  soilType: z.string().min(2, { message: 'Soil type must be at least 2 characters' }),
  soilPH: z.coerce.number().min(0, { message: 'Soil pH must be at least 0' }).max(14, { message: 'Soil pH must be at most 14' }),
});

interface AddFieldFormProps {
  farmId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddFieldForm: React.FC<AddFieldFormProps> = ({ farmId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: '',
      area: 1,
      areaUnit: 'acres',
      location: '',
      soilType: 'Clay',
      soilPH: 7.0,
    },
  });

  const onSubmit = async (data: FieldFormData) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('fields')
        .insert({
          farm_id: farmId,
          name: data.name,
          area: data.area,
          area_unit: data.areaUnit,
          soil_type: data.soilType,
          soil_ph: data.soilPH,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Field added',
        description: `The field "${data.name}" has been added successfully.`,
      });
      
      // Invalidate queries to refetch the fields list
      queryClient.invalidateQueries({ queryKey: ['fields', farmId] });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add the field.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background rounded-lg p-6 max-w-md w-full shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Add New Field</h2>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Name</FormLabel>
                <FormControl>
                  <Input placeholder="Field name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areaUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="hectares">Hectares</SelectItem>
                      <SelectItem value="bigha">Bigha</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Field location" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="soilType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soil Type</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select soil type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Clay">Clay</SelectItem>
                      <SelectItem value="Sandy">Sandy</SelectItem>
                      <SelectItem value="Loamy">Loamy</SelectItem>
                      <SelectItem value="Silty">Silty</SelectItem>
                      <SelectItem value="Peaty">Peaty</SelectItem>
                      <SelectItem value="Chalky">Chalky</SelectItem>
                      <SelectItem value="Black">Black</SelectItem>
                      <SelectItem value="Red">Red</SelectItem>
                      <SelectItem value="Alluvial">Alluvial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="soilPH"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soil pH</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Field"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddFieldForm;
