
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  categoryId: z.string().uuid({
    message: "Please select a category"
  }),
  quantity: z.number().positive({
    message: "Quantity must be a positive number",
  }),
  unit: z.string().optional(),
  purchaseDate: z.date().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  expiryDate: z.date().optional(),
  minimumStock: z.number().nonnegative().optional(),
  storageLocation: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddInventoryFormProps {
  farmId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddInventoryForm: React.FC<AddInventoryFormProps> = ({ farmId, onSuccess, onCancel }) => {
  // Query to get inventory categories
  const { data: categories = [] } = useQuery({
    queryKey: ['inventoryCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      description: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          farm_id: farmId,
          name: values.name,
          category_id: values.categoryId,
          quantity: values.quantity,
          unit: values.unit,
          purchase_date: values.purchaseDate ? values.purchaseDate.toISOString().split('T')[0] : null,
          purchase_price: values.purchasePrice,
          expiry_date: values.expiryDate ? values.expiryDate.toISOString().split('T')[0] : null,
          minimum_stock: values.minimumStock,
          storage_location: values.storageLocation,
          description: values.description,
        });

      if (error) throw error;

      toast({
        title: "Item added to inventory",
        description: "The item has been added to your inventory.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Failed to add item",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., kg, liters, bags" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Price (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter price" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter minimum stock level" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormDescription>
                  You'll be alerted when inventory falls below this level
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="storageLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Shed 1, Warehouse B" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional details..." 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          )}
          <Button type="submit">Add to Inventory</Button>
        </div>
      </form>
    </Form>
  );
};

export default AddInventoryForm;
