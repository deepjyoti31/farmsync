
import React, { useState, useEffect } from 'react';
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
import { FieldFormData, Farm } from '@/types';
import { farmRepository } from '@/services/data/FarmRepository';
import { fieldRepository } from '@/services/data/FieldRepository';
import { toast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fieldFormSchema = z.object({
  name: z.string().min(2, { message: 'Field name must be at least 2 characters' }),
  farmId: z.string().min(1, { message: 'Please select a farm' }),
  area: z.coerce.number().positive({ message: 'Area must be a positive number' }),
  areaUnit: z.string().default('acres'),
  soilType: z.string().min(2, { message: 'Soil type must be at least 2 characters' }),
  soilPH: z.coerce.number().min(0, { message: 'Soil pH must be at least 0' }).max(14, { message: 'Soil pH must be at most 14' }),
});

interface AddFieldFormProps {
  farmId?: string; // Made optional since we'll select it in the form
  onClose: () => void;
  onSuccess: () => void;
}

const AddFieldForm: React.FC<AddFieldFormProps> = ({ farmId: initialFarmId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const queryClient = useQueryClient();

  // Fetch all farms
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmRepository.getAll(),
  });

  const form = useForm<FieldFormData & { farmId: string }>({
    resolver: zodResolver(fieldFormSchema),
    defaultValues: {
      name: '',
      farmId: initialFarmId || '',
      area: 1,
      areaUnit: 'acres',
      soilType: 'Clay',
      soilPH: 7.0,
    },
  });

  // When initialFarmId changes or when farms are loaded, update the form
  useEffect(() => {
    if (initialFarmId && farms.length > 0) {
      const farm = farms.find(f => f.id === initialFarmId);
      if (farm) {
        form.setValue('farmId', farm.id);
        form.setValue('areaUnit', farm.areaUnit || 'acres');
        setSelectedFarm(farm);
      }
    }
  }, [initialFarmId, farms, form]);

  // When farm selection changes, update the area unit
  const handleFarmChange = (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      form.setValue('areaUnit', farm.areaUnit || 'acres');
      setSelectedFarm(farm);
    }
  };

  const onSubmit = async (data: FieldFormData & { farmId: string }) => {
    try {
      setIsSubmitting(true);

      await fieldRepository.create({
        farm_id: data.farmId,
        name: data.name,
        area: data.area,
        area_unit: data.areaUnit,
        soil_type: data.soilType,
        soil_ph: data.soilPH,
      });

      toast({
        title: 'Field added',
        description: `The field "${data.name}" has been added successfully.`,
      });

      // Invalidate queries to refetch the fields list
      queryClient.invalidateQueries({ queryKey: ['fields', data.farmId] });

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
    <div className="p-6">
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

          <FormField
            control={form.control}
            name="farmId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Farm</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFarmChange(value);
                  }}
                  disabled={isSubmitting || isLoadingFarms}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingFarms ? "Loading farms..." : "Select a farm"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || !!selectedFarm}
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
                  {selectedFarm && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Unit is set to match the farm's unit
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
