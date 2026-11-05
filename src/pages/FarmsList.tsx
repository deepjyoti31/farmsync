import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Loader2, MapPin, MoreHorizontal, Pencil, Plus, Rows3, Trash2, TriangleAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { deleteById } from '@/utils/deleteUtils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, VisuallyHidden } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/common/PageHeader';
import AddFarmForm from '@/components/farms/AddFarmForm';
import EditFarmForm from '@/components/farms/EditFarmForm';
import FarmDetailsDialog from '@/components/farms/FarmDetailsDialog';
import AddFieldForm from '@/components/fields/AddFieldForm';
import { fieldShapes } from '@/lib/fieldShapes';
import { toHectares } from '@/lib/yieldAnalytics';
import type { Farm } from '@/types';

type FarmRow = { id: string; name: string; village: string | null; district: string | null; state: string | null; total_area: number | null; area_unit: string | null; boundaries: unknown; gps_latitude: number | null; gps_longitude: number | null };

/** Small outline of the farm with its fields drawn inside, or nothing when nothing has been mapped. */
const FarmOutline = ({ farm, fields }: { farm: FarmRow; fields: { id: string; boundaries: unknown }[] }) => {
  const shapes = useMemo(() => fieldShapes([{ id: '__farm', boundaries: farm.boundaries }, ...fields], 320, 140, 10), [farm.boundaries, fields]);
  if (shapes.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-xl bg-background text-sm text-muted-foreground">
        <MapPin className="me-2 h-4 w-4" aria-hidden="true" /> Not mapped yet
      </div>
    );
  }
  return (
    <svg viewBox="0 0 320 140" role="img" aria-label={`Outline of ${farm.name}`} className="block h-[140px] w-full rounded-xl bg-[#EEF1E8] dark:bg-muted">
      {shapes.map((s) =>
        s.id === '__farm' ? (
          <path key={s.id} d={s.d} fill="#FFFFFF" fillOpacity={0.6} stroke="#1F6B3A" strokeWidth={2} strokeDasharray="6 4" />
        ) : (
          <path key={s.id} d={s.d} fill="#2E7D4F" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
        ),
      )}
    </svg>
  );
};

const FarmsList = () => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState<FarmRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [addFieldFor, setAddFieldFor] = useState<string | null>(null);

  const { data: farms = [], isLoading } = useQuery({
    queryKey: ['farms', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('farms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FarmRow[];
    },
  });

  const farmIds = farms.map((f) => f.id);
  const { data: fields = [] } = useQuery({
    queryKey: ['fields', 'all-farms', farmIds.join(',')],
    enabled: farmIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('fields').select('id, farm_id, area, area_unit, boundaries').in('farm_id', farmIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const byFarm = useMemo(() => {
    const m = new Map<string, typeof fields>();
    for (const f of fields) m.set(f.farm_id, [...(m.get(f.farm_id) ?? []), f]);
    return m;
  }, [fields]);

  const removeFarm = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    const problem = await deleteById('farms', deleting.id, deleting.name);
    setIsDeleting(false);
    if (problem) {
      toast({ title: 'Could not delete the farm', description: problem, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      toast({ title: `${deleting.name} deleted` });
    }
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title="Farms"
        description={farms.length > 0 ? `${farms.length} ${farms.length === 1 ? 'farm' : 'farms'} in this workspace` : 'Add each farm you manage, with its location and boundary.'}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add a farm
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading farms">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : farms.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <MapPin className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">No farms yet</h2>
          <p className="max-w-sm text-muted-foreground">Add your farm with its village and boundary. Weather, maps and reports all start from here.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add your first farm
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {farms.map((farm) => {
            const farmFields = byFarm.get(farm.id) ?? [];
            const fieldHa = farmFields.reduce((s, f) => s + (toHectares(Number(f.area) || 0, f.area_unit) ?? 0), 0);
            const located = farm.gps_latitude != null && farm.gps_longitude != null;
            const place = [farm.village, farm.district, farm.state].filter(Boolean).join(', ');
            return (
              <li key={farm.id} className="surface flex flex-col gap-3.5 p-4">
                <FarmOutline farm={farm} fields={farmFields} />
                <div className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <button type="button" onClick={() => setViewingId(farm.id)} className="truncate text-start text-lg font-bold hover:underline">
                      {farm.name}
                    </button>
                    <span className="truncate text-[13px] text-muted-foreground">{place || 'No village or district set'}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`More for ${farm.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingId(farm.id)}>
                        <Info className="h-4 w-4" /> Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(farm as unknown as Farm)}>
                        <Pencil className="h-4 w-4" /> Edit farm
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleting(farm)} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete farm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted-foreground">Total area</dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-medium">{farm.total_area ? `${farm.total_area} ${farm.area_unit || 'acres'}` : '·'}</dd>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted-foreground">Fields</dt>
                    <dd className="mt-0.5 font-mono text-[15px] font-medium">
                      {farmFields.length}
                      {fieldHa > 0 && <span className="text-muted-foreground"> · {Math.round(fieldHa * 10) / 10} ha</span>}
                    </dd>
                  </div>
                </dl>
                {!located && (
                  <p className="flex items-start gap-2 rounded-[10px] bg-warning-tint px-3 py-2.5 text-[13px] text-[#5C3A00] dark:text-warning">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    No location yet. Edit the farm and draw its boundary to get weather and maps.
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setAddFieldFor(farm.id)}>
                    <Rows3 /> Add a field
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => setEditing(farm as unknown as Farm)}>
                    <Pencil /> Edit
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Add a farm</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>Add a new farm to this workspace</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <AddFarmForm
            onClose={() => setAddOpen(false)}
            onSuccess={() => {
              setAddOpen(false);
              queryClient.invalidateQueries({ queryKey: ['farms'] });
              toast({ title: 'Farm added' });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Edit farm</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>Change this farm's details and boundary</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          {editing && (
            <EditFarmForm
              farm={editing}
              onClose={() => setEditing(null)}
              onSuccess={() => {
                setEditing(null);
                queryClient.invalidateQueries({ queryKey: ['farms'] });
                toast({ title: 'Farm updated' });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Its fields, crops, animals, tasks and money records go too. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={removeFarm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="animate-spin" />}
              Delete farm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FarmDetailsDialog farmId={viewingId} isOpen={!!viewingId} onClose={() => setViewingId(null)} />

      <Dialog open={!!addFieldFor} onOpenChange={(o) => !o && setAddFieldFor(null)}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Add a field</DialogTitle>
            <DialogDescription>You can draw its boundary afterwards on the Fields page.</DialogDescription>
          </DialogHeader>
          {addFieldFor && (
            <AddFieldForm
              farmId={addFieldFor}
              onSuccess={() => {
                const id = addFieldFor;
                setAddFieldFor(null);
                queryClient.invalidateQueries({ queryKey: ['fields'] });
                queryClient.invalidateQueries({ queryKey: ['farm-fields', id] });
                toast({ title: 'Field added' });
              }}
              onClose={() => setAddFieldFor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmsList;
