import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Map as MapIcon, PenLine, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import { DeleteButton } from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import AddFieldForm from '@/components/fields/AddFieldForm';
import EditFieldForm from '@/components/fields/EditFieldForm';
import FieldBoundaryDialog from '@/components/fields/FieldBoundaryDialog';
import FarmMap, { STAGE_LABEL, StageLegend, stageSwatch, type FieldStage } from '@/components/fields/FarmMap';
import { supabase } from '@/integrations/supabase/client';
import { cropProgress, fieldStage } from '@/lib/dashboard';
import { outerRings } from '@/lib/fieldShapes';
import { fromHectares, toHectares } from '@/lib/yieldAnalytics';
import { deleteEntity } from '@/utils/deleteUtils';
import type { Field } from '@/types';
import { cn } from '@/lib/utils';

type Unit = 'hectares' | 'acres' | 'bigha';
const UNIT_SHORT: Record<Unit, string> = { hectares: 'ha', acres: 'ac', bigha: 'bigha' };
const UNIT_KEY = 'farmsync.fields.unit';

const BADGE_FOR_STAGE: Record<FieldStage, 'default' | 'warning' | 'outline' | 'info' | 'secondary'> = {
  growing: 'default',
  ready: 'warning',
  planned: 'outline',
  harvested: 'info',
  empty: 'secondary',
};

const readUnit = (): Unit => {
  try {
    const u = localStorage.getItem(UNIT_KEY);
    return u === 'acres' || u === 'bigha' ? u : 'hectares';
  } catch {
    return 'hectares';
  }
};

const Fields = () => {
  const queryClient = useQueryClient();
  const [farmId, setFarmId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>(readUnit);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_KEY, unit);
    } catch {
      /* storage can be unavailable */
    }
  }, [unit]);

  const { data: farm } = useQuery({
    queryKey: ['farm', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('farms').select('name, gps_latitude, gps_longitude').eq('id', farmId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['fields', farmId, 'page'],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fields')
        .select('*, field_crops(id, name, planting_date, expected_harvest_date, actual_harvest_date, status, crop:crops(name, variety))')
        .eq('farm_id', farmId!)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const fields = useMemo(() => {
    const now = new Date();
    return rows.map((f) => {
      const plantings = f.field_crops ?? [];
      const live = plantings
        .map((p) => ({ p, prog: cropProgress(p, now) }))
        .filter(({ prog }) => prog.stage !== 'harvested')
        .sort((a, b) => b.prog.percent - a.prog.percent)[0];
      const cropName = live ? live.p.crop?.name || live.p.name || 'Crop' : null;
      const summary = !live
        ? 'Nothing planted'
        : live.prog.stage === 'planned'
          ? `${cropName} · sowing ${format(parseISO(live.p.planting_date), 'd MMM')}`
          : `${cropName} · day ${live.prog.day}`;
      const hectares = toHectares(Number(f.area) || 0, f.area_unit) ?? (Number(f.area) || 0);
      return { ...f, stage: fieldStage(plantings, now), summary, live, hectares, mapped: outerRings(f.boundaries).length > 0 };
    });
  }, [rows]);

  const selected = fields.find((f) => f.id === selectedId) ?? fields[0] ?? null;
  const showArea = (hectares: number) => `${(fromHectares(hectares, unit) ?? hectares).toFixed(1)} ${UNIT_SHORT[unit]}`;
  const totalHa = fields.reduce((s, f) => s + f.hectares, 0);
  const mappedCount = fields.filter((f) => f.mapped).length;
  const underCrop = fields.filter((f) => f.stage === 'growing' || f.stage === 'ready').length;

  const asFormField = (f: (typeof fields)[number]): Field => ({
    id: f.id,
    name: f.name,
    area: f.area,
    areaUnit: f.area_unit,
    soilType: f.soil_type ?? undefined,
    soilPH: f.soil_ph ?? undefined,
    location: f.location ?? '',
    crops: [],
    farm_id: f.farm_id,
    created_at: f.created_at ?? '',
    updated_at: f.updated_at ?? '',
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['fields'] });

  const remove = async (id: string) => {
    await deleteEntity({ id, entityType: 'field', onSuccess: refresh });
    if (selectedId === id) setSelectedId(null);
  };

  const farmCenter: [number, number] | null =
    farm?.gps_longitude && farm?.gps_latitude ? [Number(farm.gps_longitude), Number(farm.gps_latitude)] : null;

  return (
    <div>
      <PageHeader
        title="Fields"
        description={
          fields.length > 0
            ? `${fields.length} fields · ${showArea(totalHa)} · ${underCrop} under crop`
            : 'Map your fields to track crops, soil and work on each one.'
        }
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button disabled={!farmId} onClick={() => setAddOpen(true)}>
              <Plus /> Add field
            </Button>
          </>
        }
      />

      {!farmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading fields">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : fields.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <MapIcon className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">No fields yet</h2>
          <p className="max-w-sm text-muted-foreground">Add your first field, then draw its boundary on the map so its area is worked out for you.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add your first field
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <section aria-label="Farm map" className="surface flex min-w-0 flex-[3_1_520px] flex-col gap-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold">Map</h2>
              <span className="text-sm text-muted-foreground">
                {mappedCount} of {fields.length} drawn
              </span>
              <Segmented
                label="Area unit"
                value={unit}
                onChange={setUnit}
                className="ms-auto"
                options={[
                  { value: 'hectares', label: 'Hectare' },
                  { value: 'acres', label: 'Acre' },
                  { value: 'bigha', label: 'Bigha' },
                ]}
              />
            </div>
            {mappedCount > 0 ? (
              <FarmMap
                fields={fields}
                height={420}
                selectedId={selected?.id}
                onSelect={setSelectedId}
                label={`Map of ${farm?.name ?? 'the farm'} with ${mappedCount} field boundaries, coloured by crop stage`}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-background px-6 py-14 text-center">
                <MapIcon className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold">No boundaries drawn yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">Draw a field on the satellite map once and it shows here, coloured by what is growing.</p>
                {selected && (
                  <Button variant="outline" onClick={() => setDrawOpen(true)}>
                    <PenLine /> Draw {selected.name}
                  </Button>
                )}
              </div>
            )}
            <StageLegend />
          </section>

          <aside className="flex min-w-0 flex-[2_1_320px] flex-col gap-4">
            {selected && (
              <section aria-labelledby="field-h" className="surface flex flex-col gap-3.5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="eyebrow">Selected field</span>
                    <h2 id="field-h" className="text-2xl font-bold">
                      {selected.name}
                    </h2>
                  </div>
                  <Badge variant={BADGE_FOR_STAGE[selected.stage]}>{STAGE_LABEL[selected.stage]}</Badge>
                </div>
                <dl className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted-foreground">Area</dt>
                    <dd className="mt-1 font-mono text-[15px] font-medium">{showArea(selected.hectares)}</dd>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted-foreground">Soil</dt>
                    <dd className="mt-1 text-[15px] font-semibold">{selected.soil_type || '·'}</dd>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted-foreground">pH</dt>
                    <dd className="mt-1 font-mono text-[15px] font-medium">{selected.soil_ph ?? '·'}</dd>
                  </div>
                </dl>
                <p className="text-sm leading-relaxed text-[#34453A] dark:text-muted-foreground">
                  {selected.live
                    ? `${selected.summary}.${selected.live.p.expected_harvest_date ? ` Harvest expected from ${format(parseISO(selected.live.p.expected_harvest_date), 'd MMM yyyy')}.` : ''}`
                    : 'Nothing planted. Plan a crop for this field on the Crops page.'}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Button className="flex-[1_1_130px]" onClick={() => setDrawOpen(true)}>
                    <PenLine /> {selected.mapped ? 'Redraw boundary' : 'Draw boundary'}
                  </Button>
                  <Button variant="outline" className="flex-[1_1_100px]" onClick={() => setEditOpen(true)}>
                    <Pencil /> Edit
                  </Button>
                  <DeleteButton onDelete={() => remove(selected.id)} itemName={selected.name} entityType="Field" buttonVariant="ghost" />
                </div>
              </section>
            )}

            <section aria-label="All fields" className="surface overflow-hidden">
              <ul>
                {fields.map((f) => {
                  const on = f.id === selected?.id;
                  return (
                    <li key={f.id} className="border-b border-muted last:border-b-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setSelectedId(f.id)}
                        className={cn('flex min-h-[60px] w-full items-center gap-3.5 px-5 py-3 text-start', on ? 'bg-accent shadow-[inset_3px_0_0_hsl(var(--primary))]' : 'hover:bg-accent/60')}
                      >
                        <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: stageSwatch(f.stage) }} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[15px] font-semibold">{f.name}</span>
                          <span className="truncate text-[13px] text-muted-foreground">
                            {f.summary}
                            {!f.mapped && ' · not drawn'}
                          </span>
                        </span>
                        <span className="font-mono text-[13px] text-[#34453A] dark:text-muted-foreground">{showArea(f.hectares)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Add a field</DialogTitle>
          </DialogHeader>
          <AddFieldForm
            farmId={farmId ?? undefined}
            onSuccess={() => {
              setAddOpen(false);
              refresh();
            }}
            onClose={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Edit field</DialogTitle>
          </DialogHeader>
          {selected && (
            <EditFieldForm
              field={asFormField(selected)}
              onSuccess={() => {
                setEditOpen(false);
                refresh();
              }}
              onClose={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <FieldBoundaryDialog open={drawOpen} onOpenChange={setDrawOpen} field={selected} fallbackCenter={farmCenter} />
    </div>
  );
};

export default Fields;
