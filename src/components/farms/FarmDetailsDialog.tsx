import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Farm } from '@/types';
import { Loader2, MapPin, Calendar, Ruler, Map as MapIcon, Plus } from 'lucide-react';
import BoundaryMap from '@/components/maps/BoundaryMap';
import { formatArea, formatCoordinates } from '@/utils/mapUtils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import AddFieldForm from '@/components/fields/AddFieldForm';

interface FarmDetailsDialogProps {
  farmId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const FarmDetailsDialog: React.FC<FarmDetailsDialogProps> = ({
  farmId,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const queryClient = useQueryClient();

  // Reset active tab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setIsAddFieldOpen(false);
    }
  }, [isOpen]);

  const handleAddFieldSuccess = () => {
    setIsAddFieldOpen(false);
    // Invalidate queries to refresh the fields list
    queryClient.invalidateQueries({ queryKey: ['fields'] });
    if (farmId) {
      queryClient.invalidateQueries({ queryKey: ['farm-fields', farmId] });
    }
  };

  const { data: farm, isLoading } = useQuery({
    queryKey: ['farm-details', farmId],
    queryFn: async () => {
      if (!farmId) return null;

      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', farmId)
        .single();

      if (error) throw error;
      return data as Farm;
    },
    enabled: !!farmId && isOpen,
  });

  // Query to get fields associated with this farm
  const { data: fields = [] } = useQuery({
    queryKey: ['farm-fields', farmId],
    queryFn: async () => {
      if (!farmId) return [];

      const { data, error } = await supabase
        .from('fields')
        .select('id, name, area, area_unit')
        .eq('farm_id', farmId);

      if (error) throw error;
      return data;
    },
    enabled: !!farmId && isOpen,
  });

  // Calculate total area of fields
  const totalFieldsArea = fields.reduce((sum, field) => {
    return sum + (field.area || 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {isLoading || !farm ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">{farm.name}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Overview</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column - Farm Information */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle className="text-lg">Farm Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4 text-sm">
                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Location</dt>
                          <dd className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {[farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Not specified'}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">GPS Coordinates</dt>
                          <dd className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {farm.gps_latitude && farm.gps_longitude
                              ? formatCoordinates(farm.gps_latitude, farm.gps_longitude)
                              : 'Not available'}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Total Area</dt>
                          <dd className="flex items-center">
                            <Ruler className="h-4 w-4 mr-1 text-muted-foreground" />
                            {farm.total_area
                              ? `${formatArea(farm.total_area)} ${farm.area_unit || 'acres'}`
                              : 'Not specified'}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Fields</dt>
                          <dd className="flex items-center">
                            <MapIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                            {fields.length} field{fields.length !== 1 ? 's' : ''}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Created</dt>
                          <dd className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {farm.created_at ? format(new Date(farm.created_at), 'PPP') : 'Unknown'}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Last Updated</dt>
                          <dd className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {farm.updated_at ? format(new Date(farm.updated_at), 'PPP') : 'Unknown'}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  {/* Right column - Map */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle className="text-lg">Farm Boundaries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {farm.boundaries ? (
                        <BoundaryMap
                          existingBoundaries={farm.boundaries}
                          readOnly={true}
                          initialCenter={
                            farm.gps_latitude && farm.gps_longitude
                              ? [farm.gps_longitude, farm.gps_latitude]
                              : undefined
                          }
                          initialZoom={farm.gps_latitude && farm.gps_longitude ? 14 : 5}
                          onBoundariesChange={() => {}} // No-op since it's read-only
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <MapIcon className="h-12 w-12 text-muted-foreground/40 mb-2" />
                          <p>No boundaries have been defined for this farm.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="fields" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Fields</CardTitle>
                    <Button size="sm" onClick={() => setIsAddFieldOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Field
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {fields.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="mb-4">No fields have been added to this farm yet.</p>
                        <Button onClick={() => setIsAddFieldOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Your First Field
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Name</th>
                                <th className="text-left py-2 px-4">Area</th>
                              </tr>
                            </thead>
                            <tbody>
                              {fields.map((field) => (
                                <tr key={field.id} className="border-b">
                                  <td className="py-2 px-4">{field.name}</td>
                                  <td className="py-2 px-4">
                                    {field.area} {field.area_unit || 'acres'}
                                  </td>
                                </tr>
                              ))}
                              <tr className="font-medium">
                                <td className="py-2 px-4">Total</td>
                                <td className="py-2 px-4">
                                  {formatArea(totalFieldsArea)} {fields[0]?.area_unit || 'acres'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>

      {/* Add Field Dialog */}
      {farmId && (
        <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
          <DialogContent className="p-0 max-w-md">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Add New Field</DialogTitle>
            </DialogHeader>
            <AddFieldForm
              farmId={farmId}
              onSuccess={handleAddFieldSuccess}
              onClose={() => setIsAddFieldOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default FarmDetailsDialog;
