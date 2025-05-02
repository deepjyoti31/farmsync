
import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { format, addDays } from 'date-fns';
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

// Define crop types
const cropTypes = ['vegetables', 'fruits', 'cereals', 'flowers'] as const;

const formSchema = z.object({
  cropType: z.enum(cropTypes, {
    required_error: "Please select a crop type"
  }),
  cropId: z.string().uuid({
    message: "Please select a crop"
  }),
  fieldId: z.string().uuid({
    message: "Please select a field"
  }),
  plantingDate: z.date({
    required_error: "Planting date is required",
  }),
  expectedHarvestDate: z.date().optional(),
  status: z.enum(['planned', 'planted', 'growing', 'harvested', 'failed'], {
    required_error: "Please select a status",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddCropFormProps {
  farmId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const AddCropForm: React.FC<AddCropFormProps> = ({ farmId, onSuccess, onCancel }) => {
  // State to track the selected crop type
  const [selectedCropType, setSelectedCropType] = useState<string | null>(null);

  // Query to get crop list
  const { data: crops = [] } = useQuery({
    queryKey: ['crops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Query to get fields for selected farm
  const { data: fields = [] } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      // Get all fields from all farms to group them
      const { data, error } = await supabase
        .from('fields')
        .select('*, farm:farm_id(id, name)')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Group fields by farm for display
  const fieldsByFarm = useMemo(() => {
    const groupedFields: Record<string, any> = {};

    fields.forEach((field: any) => {
      const farmName = field.farm?.name || 'Unknown Farm';
      const farmId = field.farm?.id || 'unknown';

      if (!groupedFields[farmId]) {
        groupedFields[farmId] = {
          name: farmName,
          fields: []
        };
      }

      groupedFields[farmId].fields.push(field);
    });

    return groupedFields;
  }, [fields]);

  // Filter crops by selected type
  const filteredCrops = useMemo(() => {
    if (!selectedCropType) return [];

    // Filter crops by the crop_type field in the database
    return crops.filter((crop: any) => {
      // If crop_type is set in the database, use it
      if (crop.crop_type) {
        return crop.crop_type === selectedCropType;
      }

      // Fallback mapping for crops without a type set
      const cropTypeMapping: Record<string, string[]> = {
        vegetables: ['Tomato', 'Potato', 'Onion', 'Carrot', 'Cabbage', 'Spinach', 'Broccoli'],
        fruits: ['Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Watermelon'],
        cereals: ['Rice', 'Wheat', 'Maize', 'Barley', 'Oats', 'Corn', 'Millet'],
        flowers: ['Rose', 'Sunflower', 'Tulip', 'Lily', 'Marigold', 'Jasmine']
      };

      return cropTypeMapping[selectedCropType as keyof typeof cropTypeMapping]?.includes(crop.name);
    });
  }, [crops, selectedCropType]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'planned',
      plantingDate: new Date(),
      notes: '',
    },
  });

  // Watch for changes in cropId and plantingDate to calculate harvest date
  const cropId = useWatch({
    control: form.control,
    name: 'cropId',
  });

  const plantingDate = useWatch({
    control: form.control,
    name: 'plantingDate',
  });

  // Update crop type in form when selected
  useEffect(() => {
    if (selectedCropType) {
      form.setValue('cropType', selectedCropType as any);
    }
  }, [selectedCropType, form]);

  // Calculate expected harvest date based on crop growing duration
  useEffect(() => {
    if (cropId && plantingDate) {
      const selectedCrop = crops.find((crop: any) => crop.id === cropId);

      if (selectedCrop && selectedCrop.growing_duration) {
        const harvestDate = addDays(new Date(plantingDate), selectedCrop.growing_duration);
        form.setValue('expectedHarvestDate', harvestDate);
      }
    }
  }, [cropId, plantingDate, crops, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      // Get the selected crop for reference
      const selectedCrop = crops.find((crop: any) => crop.id === values.cropId);

      const { error } = await supabase
        .from('field_crops')
        .insert({
          crop_id: values.cropId,
          field_id: values.fieldId,
          planting_date: values.plantingDate.toISOString().split('T')[0],
          expected_harvest_date: values.expectedHarvestDate
            ? values.expectedHarvestDate.toISOString().split('T')[0]
            : null,
          status: values.status,
          notes: values.notes,
        });

      if (error) throw error;

      toast({
        title: "Crop added successfully",
        description: `${selectedCrop?.name || 'Crop'} has been added to the field.`,
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error adding crop:', error);
      toast({
        title: "Failed to add crop",
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
          name="cropType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop Category</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedCropType(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a crop category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="cereals">Cereals</SelectItem>
                  <SelectItem value="flowers">Flowers</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cropId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedCropType}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCropType ? "Select a crop" : "Select a category first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredCrops.map((crop: any) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name} {crop.variety ? `(${crop.variety})` : ''}
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
          name="fieldId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* Only show fields from the selected farm */}
                  {fieldsByFarm[farmId] && (
                    <React.Fragment>
                      <SelectItem value={farmId} disabled className="font-semibold text-muted-foreground py-2">
                        {fieldsByFarm[farmId].name}
                      </SelectItem>
                      {fieldsByFarm[farmId].fields.map((fieldItem: any) => (
                        <SelectItem key={fieldItem.id} value={fieldItem.id} className="pl-6">
                          {fieldItem.name} ({fieldItem.area} {fieldItem.area_unit})
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plantingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Planting Date</FormLabel>
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
                      selected={field.value}
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
            name="expectedHarvestDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>
                  Expected Harvest Date
                  {cropId && plantingDate && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Auto-calculated)
                    </span>
                  )}
                </FormLabel>
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
                      disabled={(date) => date < form.getValues('plantingDate')}
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
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="planted">Planted</SelectItem>
                  <SelectItem value="growing">Growing</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="Add any additional notes about this crop..."
                  {...field}
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
          <Button type="submit">Add Crop</Button>
        </div>
      </form>
    </Form>
  );
};

export default AddCropForm;
