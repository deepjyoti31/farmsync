
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
  livestockTypeId: z.string().uuid({
    message: "Please select a livestock type"
  }),
  breed: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown'], {
    required_error: "Please select a gender",
  }),
  status: z.enum(['active', 'sold', 'deceased'], {
    required_error: "Please select a status",
  }).default('active'),
  tagId: z.string().optional(),
  birthDate: z.date().optional(),
  acquisitionDate: z.date().optional(),
  acquisitionCost: z.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddLivestockFormProps {
  farmId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddLivestockForm: React.FC<AddLivestockFormProps> = ({ farmId, onSuccess, onCancel }) => {
  // Query to get livestock types
  const { data: livestockTypes = [] } = useQuery({
    queryKey: ['livestockTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'active',
      gender: 'unknown',
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase
        .from('livestock')
        .insert({
          farm_id: farmId,
          livestock_type_id: values.livestockTypeId,
          breed: values.breed,
          gender: values.gender,
          status: values.status,
          tag_id: values.tagId,
          birth_date: values.birthDate ? values.birthDate.toISOString().split('T')[0] : null,
          acquisition_date: values.acquisitionDate 
            ? values.acquisitionDate.toISOString().split('T')[0] 
            : null,
          acquisition_cost: values.acquisitionCost,
          notes: values.notes,
        });

      if (error) throw error;

      toast({
        title: "Livestock added successfully",
        description: "The livestock has been added to your farm.",
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error adding livestock:', error);
      toast({
        title: "Failed to add livestock",
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
          name="livestockTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Livestock Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {livestockTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} {type.category ? `(${type.category})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Breed (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter breed" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
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
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="deceased">Deceased</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tagId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag ID / Identification (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter tag ID" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Birth Date (Optional)</FormLabel>
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
            name="acquisitionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Acquisition Date (Optional)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="acquisitionCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acquisition Cost (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter cost" 
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes..." 
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
          <Button type="submit">Add Livestock</Button>
        </div>
      </form>
    </Form>
  );
};

export default AddLivestockForm;
