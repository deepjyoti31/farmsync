import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Sprout, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import UpdateCropStatusForm from './UpdateCropStatusForm';

interface CropDetailsDialogProps {
  cropId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CropDetailsDialog: React.FC<CropDetailsDialogProps> = ({
  cropId,
  isOpen,
  onClose,
}) => {
  // Fetch crop details
  const { data: cropDetails, isLoading } = useQuery({
    queryKey: ['crop-details', cropId],
    queryFn: async () => {
      if (!cropId) return null;

      const { data, error } = await supabase
        .from('field_crops')
        .select(`
          *,
          crop:crops(*),
          field:field_id(*, farm:farm_id(name))
        `)
        .eq('id', cropId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!cropId && isOpen,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-muted/40">Planned</Badge>;
      case 'planted':
        return <Badge variant="outline" className="bg-farm-green/10 text-farm-green border-farm-green/20">Planted</Badge>;
      case 'growing':
        return <Badge variant="outline" className="bg-farm-lightGreen/10 text-farm-lightGreen border-farm-lightGreen/20">Growing</Badge>;
      case 'harvested':
        return <Badge variant="outline" className="bg-farm-brown/10 text-farm-brown border-farm-brown/20">Harvested</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {isLoading || !cropDetails ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                {cropDetails.crop?.name || 'Crop Details'}
                {cropDetails.crop?.variety && <span className="text-lg text-muted-foreground">({cropDetails.crop.variety})</span>}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-6">
              {/* Status Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Status</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(cropDetails.status)}
                      </div>
                    </div>
                    <UpdateCropStatusForm 
                      cropId={cropId} 
                      currentStatus={cropDetails.status} 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Crop Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Crop Information</h3>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground mb-1">Crop Type</dt>
                        <dd className="flex items-center">
                          <Sprout className="h-4 w-4 mr-1 text-muted-foreground" />
                          {cropDetails.crop?.name || 'Unknown'}
                        </dd>
                      </div>
                      
                      {cropDetails.crop?.variety && (
                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Variety</dt>
                          <dd>{cropDetails.crop.variety}</dd>
                        </div>
                      )}
                      
                      {cropDetails.crop?.growing_duration && (
                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Growing Duration</dt>
                          <dd>{cropDetails.crop.growing_duration} days</dd>
                        </div>
                      )}
                      
                      {cropDetails.crop?.growing_season && (
                        <div>
                          <dt className="font-medium text-muted-foreground mb-1">Growing Season</dt>
                          <dd>{cropDetails.crop.growing_season}</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Planting Details</h3>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="font-medium text-muted-foreground mb-1">Field</dt>
                        <dd className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {cropDetails.field?.name || 'Unknown Field'}
                          {cropDetails.field?.farm?.name && (
                            <span className="text-muted-foreground ml-1">
                              ({cropDetails.field.farm.name})
                            </span>
                          )}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-muted-foreground mb-1">Planting Date</dt>
                        <dd className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {cropDetails.planting_date ? format(new Date(cropDetails.planting_date), 'PPP') : 'Not set'}
                        </dd>
                      </div>
                      
                      <div>
                        <dt className="font-medium text-muted-foreground mb-1">Expected Harvest Date</dt>
                        <dd className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {cropDetails.expected_harvest_date 
                            ? format(new Date(cropDetails.expected_harvest_date), 'PPP') 
                            : 'Not set'}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>

              {/* Notes Section */}
              {cropDetails.notes && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Notes
                    </h3>
                    <Separator className="my-2" />
                    <p className="text-sm whitespace-pre-line">{cropDetails.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CropDetailsDialog;
