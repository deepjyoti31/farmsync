import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PawPrint, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import FarmSelector from '@/components/farms/FarmSelector';
import { KpiTile } from '@/components/dashboard/SideCards';
import AddLivestockForm from '@/components/livestock/AddLivestockForm';
import LivestockTable from '@/components/livestock/LivestockTable';
import HealthRecordsCard from '@/components/livestock/HealthRecordsCard';
import ProductionCard from '@/components/livestock/ProductionCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { herdSummary, upcomingHealthDue } from '@/lib/livestockRecords';
import { deleteEntity } from '@/utils/deleteUtils';
import { cn } from '@/lib/utils';

type StatusFilter = 'active' | 'gone' | 'all';
const ALL = '__all__';

const Livestock = () => {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<string>(ALL);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['livestock', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('livestock').select('*, livestock_type:livestock_types(*)').eq('farm_id', farmId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Same query (and cache entry) as the health card, so this adds no extra request.
  const { data: healthRecords = [] } = useQuery({
    queryKey: ['livestock_health_records', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock_health_records')
        .select('*, livestock!inner(farm_id)')
        .eq('livestock.farm_id', farmId!)
        .order('record_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const herd = useMemo(() => herdSummary(animals), [animals]);
  // Reminders only matter for animals still on the farm.
  const due = useMemo(() => {
    const live = new Set(animals.filter((a) => !a.status || a.status === 'active').map((a) => a.id));
    return upcomingHealthDue(healthRecords.filter((r) => live.has(r.livestock_id)));
  }, [healthRecords, animals]);
  const late = due.filter((d) => d.daysUntilDue < 0).length;
  const gone = animals.length - herd.active;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return animals
      .filter((a) => {
        const isActive = !a.status || a.status === 'active';
        if (status === 'active' && !isActive) return false;
        if (status === 'gone' && isActive) return false;
        if (type !== ALL && (a.livestock_type?.name ?? 'Animal') !== type) return false;
        if (q && !`${a.tag_id ?? ''} ${a.breed ?? ''} ${a.livestock_type?.name ?? ''} ${a.notes ?? ''}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.livestock_type?.name ?? '').localeCompare(b.livestock_type?.name ?? '') || (a.tag_id ?? '').localeCompare(b.tag_id ?? '', undefined, { numeric: true }));
  }, [animals, status, type, query]);

  const remove = async (id: string) => {
    await deleteEntity({ id, entityType: 'livestock', onSuccess: () => queryClient.invalidateQueries({ queryKey: ['livestock'] }) });
  };

  const typeChip = (name: string, count: number | null, value: string) => {
    const on = type === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={on}
        onClick={() => setType(value)}
        className={cn(
          'flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors',
          on ? 'border-primary bg-primary text-primary-foreground' : 'border-[#C9D1C5] bg-card text-foreground hover:bg-accent dark:border-input',
        )}
      >
        {name}
        {count !== null && <span className={cn('font-mono text-xs font-medium', on ? 'opacity-90' : 'text-muted-foreground')}>{count}</span>}
      </button>
    );
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        description="Your animals, their health and what they produce."
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button disabled={!farmId} onClick={() => setAddOpen(true)}>
              <Plus /> Add an animal
            </Button>
          </>
        }
      />

      {!farmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading livestock">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : animals.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <PawPrint className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">No animals yet</h2>
          <p className="max-w-sm text-muted-foreground">Add your herd or flock to track health, vaccinations and milk or egg production.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add the first animal
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <KpiTile label="On the farm" value={String(herd.active)} note={gone > 0 ? `${gone} sold or died` : 'animals'} />
            <KpiTile
              label="Herd"
              value={String(herd.byType.length)}
              note={herd.byType.slice(0, 3).map((t) => `${t.count} ${t.name.toLowerCase()}`).join(' · ') || 'types'}
            />
            <KpiTile
              label="Health checks due"
              value={String(due.length)}
              note={late > 0 ? `${late} overdue` : due.length > 0 ? 'in the next two weeks' : 'nothing in the next two weeks'}
            />
          </div>

          <section aria-labelledby="register-h" className="surface overflow-hidden">
            <div className="flex flex-col gap-3 px-5 pb-3 pt-5 md:px-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 id="register-h" className="me-auto text-xl font-bold">
                  Animal register
                </h2>
                <label className="flex h-10 min-w-[200px] items-center gap-2 rounded-[10px] border border-input bg-card px-2.5 text-muted-foreground focus-within:border-primary">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tag, breed or note"
                    aria-label="Search animals"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                  />
                </label>
                <Segmented
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'active', label: 'On farm' },
                    { value: 'gone', label: 'Sold or died' },
                    { value: 'all', label: 'All' },
                  ]}
                />
              </div>
              {herd.byType.length > 1 && (
                <div role="group" aria-label="Animal type" className="flex flex-wrap gap-2">
                  {typeChip('All types', null, ALL)}
                  {herd.byType.map((t) => typeChip(t.name, t.count, t.name))}
                </div>
              )}
            </div>
            {visible.length === 0 ? (
              <p className="px-5 pb-8 pt-2 text-center text-muted-foreground md:px-6">No animals match.</p>
            ) : (
              <LivestockTable livestock={visible} onDelete={remove} />
            )}
            <p className="border-t border-muted px-5 py-3 text-[13px] text-muted-foreground md:px-6">
              {visible.length} of {animals.length} animals
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HealthRecordsCard farmId={farmId} animals={animals} />
            <ProductionCard farmId={farmId} animals={animals} />
          </div>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add an animal</DialogTitle>
          </DialogHeader>
          {farmId && (
            <AddLivestockForm
              farmId={farmId}
              onSuccess={() => {
                setAddOpen(false);
                queryClient.invalidateQueries({ queryKey: ['livestock'] });
                toast({ title: 'Animal added' });
              }}
              onCancel={() => setAddOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Livestock;
