
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const farmFormSchema = z.object({
  name: z.string().min(2, { message: 'Farm name must be at least 2 characters' }),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  totalArea: z.coerce.number().nonnegative().optional(),
  areaUnit: z.string().default('acres'),
});

type FarmFormData = z.infer<typeof farmFormSchema>;

interface AddFarmFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddFarmForm: React.FC<AddFarmFormProps> = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      name: '',
      village: '',
      district: '',
      state: '',
      totalArea: 0,
      areaUnit: 'acres',
    },
  });

  const onSubmit = async (data: FarmFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add a farm.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('farms')
        .insert({
          user_id: user.id,
          name: data.name,
          village: data.village || null,
          district: data.district || null,
          state: data.state || null,
          total_area: data.totalArea || null,
          area_unit: data.areaUnit,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Farm added',
        description: `The farm "${data.name}" has been added successfully.`,
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add the farm.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background rounded-lg p-6 max-w-md w-full shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Add New Farm</h2>
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
                <FormLabel>Farm Name</FormLabel>
                <FormControl>
                  <Input placeholder="Farm name" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="village"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Village</FormLabel>
                <FormControl>
                  <Input placeholder="Village" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District</FormLabel>
                  <FormControl>
                    <Input placeholder="District" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalArea"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Area (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      step="0.01"
                      placeholder="0" 
                      {...field}
                      disabled={isSubmitting} 
                    />
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
                "Add Farm"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddFarmForm;
