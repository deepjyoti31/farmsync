import React, { Suspense, lazy, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculateArea, calculateCenter } from '@/utils/mapUtils';
import { fromHectares } from '@/lib/yieldAnalytics';
import { outerRings } from '@/lib/fieldShapes';

// Mapbox is large; load it only when someone opens this dialog.
const BoundaryMap = lazy(() => import('@/components/maps/BoundaryMap'));

interface FieldBoundaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: { id: string; name: string; area: number; area_unit: string; boundaries: unknown } | null;
  /** Where to centre the map when the field has no boundary yet: [longitude, latitude] */
  fallbackCenter?: [number, number] | null;
}

/** Draw or redraw a field's boundary on the satellite map and save it, optionally updating the area. */
const FieldBoundaryDialog = ({ open, onOpenChange, field, fallbackCenter }: FieldBoundaryDialogProps) => {
  const queryClient = useQueryClient();
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [updateArea, setUpdateArea] = useState(true);
  const [saving, setSaving] = useState(false);

  const existing = field ? outerRings(field.boundaries)[0] : undefined;
  const existingPolygon: GeoJSON.Polygon | null = existing ? { type: 'Polygon', coordinates: [existing] } : null;
  const center = existingPolygon ? calculateCenter(existingPolygon) : fallbackCenter ?? undefined;

  const hectares = polygon ? calculateArea(polygon, 'hectares') : 0;
  const inUnit = field && polygon ? fromHectares(hectares, field.area_unit) : null;

  const save = async () => {
    if (!field || !polygon) return;
    setSaving(true);
    const patch: { boundaries: GeoJSON.Polygon; area?: number } = { boundaries: polygon };
    if (updateArea && inUnit !== null) patch.area = Math.round(inUnit * 100) / 100;
    // The generated types describe boundaries as Json; a GeoJSON polygon is valid JSON.
    const { error } = await supabase.from('fields').update(patch as never).eq('id', field.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save the boundary', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['fields'] });
    toast({ title: 'Boundary saved', description: `${field.name} is on the map.` });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setPolygon(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{existingPolygon ? 'Redraw boundary' : 'Draw boundary'}: {field?.name}</DialogTitle>
          <DialogDescription>Tap each corner of the field on the map, then tap the first corner again to close the shape.</DialogDescription>
        </DialogHeader>
        {open && field && (
          <Suspense
            fallback={
              <div className="flex h-[360px] items-center justify-center rounded-xl bg-muted" role="status" aria-label="Loading map">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
          >
            <BoundaryMap
              key={field.id}
              initialCenter={center}
              initialZoom={center ? 16 : undefined}
              existingBoundaries={existingPolygon}
              onBoundariesChange={setPolygon}
            />
          </Suspense>
        )}
        {polygon && field && (
          <label className="flex items-center gap-3 rounded-xl bg-background px-4 py-3 text-sm">
            <Checkbox checked={updateArea} onCheckedChange={(c) => setUpdateArea(c === true)} disabled={inUnit === null} />
            <span>
              Set the area to <strong className="font-mono">{inUnit !== null ? `${inUnit.toFixed(2)} ${field.area_unit}` : `${hectares.toFixed(2)} ha`}</strong>{' '}
              <span className="text-muted-foreground">(now {field.area} {field.area_unit})</span>
            </span>
          </label>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!polygon || saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save boundary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FieldBoundaryDialog;
