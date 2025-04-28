
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Map, ChevronRight, ChevronLeft } from 'lucide-react';
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
import BoundaryMap from '@/components/maps/BoundaryMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as GeoJSON from 'geojson';
import { calculateArea, formatArea, calculateCenter, formatCoordinates } from '@/utils/mapUtils';

const farmFormSchema = z.object({
  name: z.string().min(2, { message: 'Farm name must be at least 2 characters' }),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  areaUnit: z.string().default('acres'),
});

type FarmFormData = z.infer<typeof farmFormSchema>;

interface AddFarmFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddFarmForm: React.FC<AddFarmFormProps> = ({ onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [boundaries, setBoundaries] = useState<GeoJSON.Polygon | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number>(0);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number]>([0, 0]);
  const { user } = useAuth();

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      name: '',
      village: '',
      district: '',
      state: '',
      areaUnit: 'acres',
    },
  });

  const handleBoundariesChange = (newBoundaries: GeoJSON.Polygon | null) => {
    setBoundaries(newBoundaries);

    if (newBoundaries) {
      // Calculate area based on the drawn boundaries
      const area = calculateArea(newBoundaries, form.getValues().areaUnit as 'acres' | 'hectares');
      setCalculatedArea(area);

      // Calculate center coordinates
      const center = calculateCenter(newBoundaries);
      setCenterCoordinates(center);
    } else {
      setCalculatedArea(0);
      setCenterCoordinates([0, 0]);
    }
  };

  // Recalculate area when area unit changes
  useEffect(() => {
    if (boundaries) {
      const area = calculateArea(boundaries, form.getValues().areaUnit as 'acres' | 'hectares');
      setCalculatedArea(area);
    }
  }, [form.watch('areaUnit'), boundaries]);

  const goToNextStep = () => {
    if (activeTab === "details") {
      // Validate the form before proceeding to the next step
      const isValid = form.trigger();
      isValid.then((valid) => {
        if (valid) {
          setActiveTab("boundaries");
        }
      });
    } else if (activeTab === "boundaries") {
      if (!boundaries) {
        toast({
          title: 'Boundary Required',
          description: 'Please mark the farm boundaries on the map before proceeding.',
          variant: 'destructive',
        });
        return;
      }
      setActiveTab("review");
    }
  };

  const goToPreviousStep = () => {
    if (activeTab === "boundaries") {
      setActiveTab("details");
    } else if (activeTab === "review") {
      setActiveTab("boundaries");
    }
  };

  const onSubmit = async (data: FarmFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add a farm.',
        variant: 'destructive',
      });
      return;
    }

    if (!boundaries) {
      toast({
        title: 'Boundary Required',
        description: 'Please mark the farm boundaries on the map before adding the farm.',
        variant: 'destructive',
      });
      setActiveTab("boundaries");
      return;
    }

    try {
      setIsSubmitting(true);

      // Use the pre-calculated center coordinates
      const [centerLat, centerLng] = centerCoordinates;

      const { error } = await supabase
        .from('farms')
        .insert({
          user_id: user.id,
          name: data.name,
          village: data.village || null,
          district: data.district || null,
          state: data.state || null,
          total_area: calculatedArea,
          area_unit: data.areaUnit,
          gps_latitude: centerLat,
          gps_longitude: centerLng,
          boundaries: boundaries,
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
    <div className="bg-background p-4 w-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Add New Farm</h2>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger
            value="details"
            onClick={() => setActiveTab("details")}
            disabled={isSubmitting}
          >
            1. Farm Details
          </TabsTrigger>
          <TabsTrigger
            value="boundaries"
            onClick={() => activeTab === "review" ? setActiveTab("boundaries") : null}
            disabled={isSubmitting || activeTab === "details"}
          >
            2. Mark Boundaries
          </TabsTrigger>
          <TabsTrigger
            value="review"
            disabled={isSubmitting || activeTab === "details" || activeTab === "boundaries"}
          >
            3. Review & Submit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-3">
          <Form {...form}>
            <div className="space-y-3">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <FormField
                  control={form.control}
                  name="areaUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Unit</FormLabel>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        The farm area will be calculated automatically from the boundaries you mark on the map.
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isSubmitting}
                >
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Form>
        </TabsContent>

        <TabsContent value="boundaries" className="space-y-3">
          <div>
            <h3 className="text-lg font-medium mb-1">Mark Farm Boundaries</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Use the polygon tool <span className="inline-block bg-blue-100 text-blue-800 px-1 rounded">◻</span> in the top left corner of the map to draw your farm boundaries.
              Click on the map to add points and complete the polygon by clicking on the first point.
            </p>

            <BoundaryMap
              onBoundariesChange={handleBoundariesChange}
              existingBoundaries={boundaries}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isSubmitting}
              size="sm"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={isSubmitting || !boundaries}
              size="sm"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-3">
          <div>
            <h3 className="text-lg font-medium mb-1">Review Farm Details</h3>
            <p className="text-muted-foreground text-sm mb-2">
              Please review the farm details and boundaries before submitting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">Farm Information</h4>
                  <dl className="grid grid-cols-2 gap-1 text-sm">
                    <dt className="text-muted-foreground font-medium">Name:</dt>
                    <dd className="font-semibold">{form.getValues().name}</dd>

                    <dt className="text-muted-foreground font-medium">Village:</dt>
                    <dd>{form.getValues().village || 'Not specified'}</dd>

                    <dt className="text-muted-foreground font-medium">District:</dt>
                    <dd>{form.getValues().district || 'Not specified'}</dd>

                    <dt className="text-muted-foreground font-medium">State:</dt>
                    <dd>{form.getValues().state || 'Not specified'}</dd>
                  </dl>
                </div>

                <div className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">Boundary Information</h4>
                  <dl className="grid grid-cols-2 gap-1 text-sm mb-3">
                    <dt className="text-muted-foreground font-medium">Calculated Area:</dt>
                    <dd className="font-semibold">
                      {formatArea(calculatedArea)} {form.getValues().areaUnit}
                    </dd>

                    <dt className="text-muted-foreground font-medium">GPS Coordinates:</dt>
                    <dd>
                      {formatCoordinates(centerCoordinates[0], centerCoordinates[1])}
                    </dd>
                  </dl>

                  <p className="text-muted-foreground text-sm mb-2">
                    These boundaries will be used for:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Weather forecasts for your location</li>
                    <li>Precision farming features</li>
                    <li>Field planning and management</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-1">Farm Boundaries</h4>
                <BoundaryMap
                  existingBoundaries={boundaries}
                  readOnly={true}
                />
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isSubmitting}
                  size="sm"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button type="submit" disabled={isSubmitting} size="sm">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Farm"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddFarmForm;
