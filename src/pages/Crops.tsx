import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Eye, Loader2, Plus, Sprout } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import { DeleteButton } from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import AddCropForm from '@/components/crops/AddCropForm';
import CropDetailsDialog from '@/components/crops/CropDetailsDialog';
import CropCalendar from '@/components/crops/CropCalendar';
import SeasonTimeline, { type TimelinePlanting } from '@/components/crops/SeasonTimeline';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cropEvents } from '@/lib/cropCalendar';
import { cropProgress, type CropStage } from '@/lib/dashboard';
import { deleteEntity } from '@/utils/deleteUtils';

type View = 'timeline' | 'calendar' | 'list';

const STAGE_BADGE: Record<CropStage, { variant: 'outline' | 'default' | 'warning' | 'info' | 'destructive'; label: string }> = {
  planned: { variant: 'outline', label: 'Planned' },
  growing: { variant: 'default', label: 'Growing' },
  ready: { variant: 'warning', label: 'Ready' },
  harvested: { variant: 'info', label: 'Harvested' },
};

const EVENT_LABEL = { planting: 'Sow', expected_harvest: 'Harvest', harvest: 'Harvested' } as const;

const Crops = () => {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [view, setView] = useState<View>('timeline');
  const [addOpen, setAddOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: fields = [], isLoading: loadingFields } = useQuery({
    queryKey: ['fields', farmId, 'names'],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('fields').select('id, name, area, area_unit').eq('farm_id', farmId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const fieldIds = fields.map((f) => f.id);
  const { data: plantings = [], isLoading: loadingCrops } = useQuery({
    queryKey: ['field_crops', farmId, fieldIds.join(',')],
    enabled: !!farmId && fieldIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('field_crops').select('*, crop:crops(*)').in('field_id', fieldIds).order('planting_date');
      if (error) throw error;
      return data ?? [];
    },
  });

  const fieldById = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);
  const fieldNames = useMemo(() => new Map(fields.map((f) => [f.id, f.name])), [fields]);
  const now = useMemo(() => new Date(), []);

  const timeline: TimelinePlanting[] = plantings.map((p) => {
    const f = fieldById.get(p.field_id);
    return {
      ...p,
      label: [p.crop?.name || p.name || 'Crop', p.crop?.variety].filter(Boolean).join(' · '),
      where: f ? `${f.name} · ${f.area} ${f.area_unit}` : 'Field',
    };
  });

  const stages = plantings.map((p) => cropProgress(p, now).stage);
  const inGround = stages.filter((s) => s === 'growing' || s === 'ready').length;
  const upcoming = cropEvents(plantings, fieldNames)
    .filter((e) => e.kind !== 'harvest')
    .filter((e) => {
      const d = differenceInCalendarDays(parseISO(e.date), now);
      return d >= 0 && d <= 45;
    })
    .slice(0, 6);
  // Compare calendar days: a harvest expected today is at local midnight, which is already before `now`.
  const nextHarvest = cropEvents(plantings, fieldNames).find((e) => e.kind === 'expected_harvest' && differenceInCalendarDays(parseISO(e.date), now) >= 0);

  const remove = async (id: string) => {
    await deleteEntity({
      id,
      entityType: 'crop',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['field_crops'] });
        toast({ title: 'Planting deleted' });
      },
    });
  };

  const loading = loadingFields || loadingCrops;

  return (
    <div>
      <PageHeader
        title="Crops"
        description={
          plantings.length > 0
            ? `${plantings.length} plantings · ${inGround} in the ground${nextHarvest ? ` · next harvest from ${format(parseISO(nextHarvest.date), 'd MMM')}` : ''}`
            : 'Plan each planting and follow it from sowing to harvest.'
        }
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button disabled={!farmId || fields.length === 0} onClick={() => setAddOpen(true)}>
              <Plus /> Plan a crop
            </Button>
          </>
        }
      />

      {!farmId || loading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading crops">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : plantings.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <Sprout className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">{fields.length === 0 ? 'Add a field first' : 'Nothing planned yet'}</h2>
          <p className="max-w-sm text-muted-foreground">
            {fields.length === 0
              ? 'Crops are planted in fields. Add your fields, then plan what goes in each one.'
              : 'Add a planting with its sowing date and expected harvest to see it on the season plan.'}
          </p>
          {fields.length > 0 && (
            <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
              <Plus /> Plan your first crop
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            className="self-start"
            options={[
              { value: 'timeline', label: 'Season plan' },
              { value: 'calendar', label: 'Calendar' },
              { value: 'list', label: 'List' },
            ]}
          />

          {view === 'timeline' && (
            <>
              <SeasonTimeline plantings={timeline} onSelect={setViewingId} />
              <section aria-labelledby="upcoming-h" className="surface p-5 pb-2 md:p-6 md:pb-2">
                <h2 id="upcoming-h" className="mb-1 text-xl font-bold">
                  Coming up
                </h2>
                {upcoming.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">No sowing or harvest in the next six weeks.</p>
                ) : (
                  <ol>
                    {upcoming.map((e) => {
                      const d = parseISO(e.date);
                      return (
                        <li key={`${e.plantingId}-${e.kind}`} className="flex items-center gap-3.5 border-t border-muted py-3 first:border-t-0">
                          <span className="flex w-[52px] shrink-0 flex-col items-center rounded-[10px] bg-background py-1.5">
                            <span className="font-mono text-[11px] uppercase text-muted-foreground">{format(d, 'MMM')}</span>
                            <span className="font-display text-xl font-bold leading-tight">{format(d, 'd')}</span>
                          </span>
                          <span className="flex flex-1 flex-col gap-0.5">
                            <span className="text-[15px] font-semibold">
                              {EVENT_LABEL[e.kind]} {e.cropName.toLowerCase()}
                            </span>
                            <span className="text-[13px] text-muted-foreground">{e.fieldName}</span>
                          </span>
                          <Badge variant={e.kind === 'planting' ? 'default' : 'warning'}>{e.kind === 'planting' ? 'Sowing' : 'Harvest'}</Badge>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </>
          )}

          {view === 'calendar' && <CropCalendar plantings={plantings} fieldNames={fieldNames} onSelectPlanting={setViewingId} />}

          {view === 'list' && (
            <section aria-label="All plantings" className="surface overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Sown</TableHead>
                    <TableHead>Harvest</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-end">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.map((p) => {
                    const stage = p.status === 'failed' ? { variant: 'destructive' as const, label: 'Failed' } : STAGE_BADGE[cropProgress(p, now).stage];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">{p.label}</TableCell>
                        <TableCell>{fieldNames.get(p.field_id) ?? '·'}</TableCell>
                        <TableCell className="font-mono text-[13px]">{format(parseISO(p.planting_date), 'd MMM yyyy')}</TableCell>
                        <TableCell className="font-mono text-[13px]">
                          {p.actual_harvest_date
                            ? format(parseISO(p.actual_harvest_date), 'd MMM yyyy')
                            : p.expected_harvest_date
                              ? `~${format(parseISO(p.expected_harvest_date), 'd MMM yyyy')}`
                              : '·'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={stage.variant}>{stage.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setViewingId(p.id)} aria-label={`Open ${p.label}`}>
                              <Eye /> Open
                            </Button>
                            <DeleteButton onDelete={() => remove(p.id)} itemName={p.label} entityType="Planting" buttonSize="sm" buttonVariant="ghost" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Plan a crop</DialogTitle>
          </DialogHeader>
          {farmId && (
            <AddCropForm
              farmId={farmId}
              onSuccess={() => {
                setAddOpen(false);
                queryClient.invalidateQueries({ queryKey: ['field_crops'] });
                toast({ title: 'Planting added' });
              }}
              onCancel={() => setAddOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <CropDetailsDialog cropId={viewingId} isOpen={!!viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
};

export default Crops;
