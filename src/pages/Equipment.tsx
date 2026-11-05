import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO, startOfYear } from 'date-fns';
import { FileText, Loader2, Pencil, Plus, Tractor, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import { DeleteButton } from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import { KpiTile } from '@/components/dashboard/SideCards';
import AddEquipmentForm from '@/components/equipment/AddEquipmentForm';
import EditEquipmentForm from '@/components/equipment/EditEquipmentForm';
import MaintenanceDialog from '@/components/equipment/MaintenanceDialog';
import { supabase } from '@/integrations/supabase/client';
import { deleteById } from '@/utils/deleteUtils';
import { useToast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/dashboard';
import { maintenanceCostByEquipment, serviceState, sortByService, type ServiceState } from '@/lib/maintenance';
import type { Equipment } from '@/types';
import { cn } from '@/lib/utils';

type View = 'machines' | 'history';

const STATUS: Record<string, { variant: 'default' | 'warning' | 'info' | 'secondary'; label: string }> = {
  operational: { variant: 'default', label: 'Working' },
  'needs maintenance': { variant: 'warning', label: 'Needs maintenance' },
  'in repair': { variant: 'info', label: 'In repair' },
  inactive: { variant: 'secondary', label: 'Not in use' },
};

const SERVICE_TONE: Record<ServiceState, string> = {
  overdue: 'bg-rust-tint text-rust',
  due_soon: 'bg-warning-tint text-[#5C3A00] dark:text-warning',
  scheduled: 'bg-background text-[#34453A] dark:text-muted-foreground',
  unscheduled: 'bg-background text-muted-foreground',
};

const serviceText = (date: string | null) => {
  const state = serviceState(date);
  if (state === 'unscheduled') return 'No service scheduled';
  const days = differenceInCalendarDays(parseISO(date!), new Date());
  const when = format(parseISO(date!), 'd MMM yyyy');
  if (state === 'overdue') return `Service overdue by ${-days} ${days === -1 ? 'day' : 'days'} (${when})`;
  if (days === 0) return 'Service due today';
  return `Next service ${when}${state === 'due_soon' ? `, in ${days} ${days === 1 ? 'day' : 'days'}` : ''}`;
};

const EquipmentPage = () => {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [view, setView] = useState<View>('machines');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceFor, setServiceFor] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['equipment', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment').select('*').eq('farm_id', farmId!).order('name');
      if (error) throw error;
      return (data ?? []) as Equipment[];
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ['equipment_maintenance', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_maintenance')
        .select('*, equipment!inner(name, farm_id)')
        .eq('equipment.farm_id', farmId!)
        .order('maintenance_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sorted = useMemo(() => sortByService(machines), [machines]);
  const spend = useMemo(() => maintenanceCostByEquipment(records), [records]);
  const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');
  const spendThisYear = records.filter((r) => r.maintenance_date >= yearStart).reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const lastService = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of records) if (!m.has(r.equipment_id)) m.set(r.equipment_id, r.maintenance_date);
    return m;
  }, [records]);

  const working = machines.filter((m) => m.status === 'operational').length;
  const states = machines.map((m) => serviceState(m.next_maintenance_date));
  const overdue = states.filter((s) => s === 'overdue').length;
  const dueSoon = states.filter((s) => s === 'due_soon').length;
  const value = machines.reduce((s, m) => s + (Number(m.purchase_price) || 0), 0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['equipment'] });

  const remove = async (m: Equipment) => {
    const problem = await deleteById('equipment', m.id, m.name);
    if (problem) {
      toast({ title: 'Could not delete the machine', description: problem, variant: 'destructive' });
      return;
    }
    refresh();
    toast({ title: `${m.name} deleted` });
  };

  const logService = (id: string | null) => {
    setServiceFor(id);
    setServiceOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Equipment"
        description="Machines and tools, when each is due for service, and what upkeep costs."
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button variant="outline" disabled={machines.length === 0} onClick={() => logService(null)}>
              <Wrench /> Log a service
            </Button>
            <Button disabled={!farmId} onClick={() => setAddOpen(true)}>
              <Plus /> Add a machine
            </Button>
          </>
        }
      />

      {!farmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading equipment">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : machines.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <Tractor className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">No machines yet</h2>
          <p className="max-w-sm text-muted-foreground">Add your tractor, pumps and tools to keep their service history and get reminded before a service is due.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add the first machine
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <KpiTile label="Machines" value={String(machines.length)} note={value > 0 ? `${formatMoney(value)} bought` : undefined} />
            <KpiTile label="Working" value={String(working)} note={`of ${machines.length} machines`} />
            <KpiTile
              label="Service due"
              value={String(overdue + dueSoon)}
              note={overdue > 0 ? `${overdue} overdue` : dueSoon > 0 ? 'in the next 14 days' : 'nothing in the next 14 days'}
            />
            <KpiTile label="Upkeep this year" value={formatMoney(spendThisYear)} note={`${records.filter((r) => r.maintenance_date >= yearStart).length} services logged`} />
          </div>

          <Segmented
            label="View"
            value={view}
            onChange={setView}
            className="self-start"
            options={[
              { value: 'machines', label: 'Machines' },
              { value: 'history', label: `Service history · ${records.length}` },
            ]}
          />

          {view === 'machines' ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
              {sorted.map((m) => {
                const state = serviceState(m.next_maintenance_date);
                const status = STATUS[m.status] ?? { variant: 'secondary' as const, label: m.status };
                const last = lastService.get(m.id) ?? m.last_maintenance_date;
                return (
                  <li key={m.id} className="surface flex flex-col gap-3.5 p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf-tint text-primary">
                        <Tractor className="h-[22px] w-[22px]" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <h3 className="truncate text-lg font-bold">{m.name}</h3>
                        <span className="truncate text-[13px] text-muted-foreground">
                          {[m.equipment_type, [m.manufacturer, m.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className={cn('rounded-[10px] px-3 py-2.5 text-sm font-medium', SERVICE_TONE[state])}>{serviceText(m.next_maintenance_date)}</p>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Last service</dt>
                        <dd className="font-mono text-[13px]">{last ? format(parseISO(last), 'd MMM yyyy') : '·'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Spent on upkeep</dt>
                        <dd className="font-mono text-[13px]">{formatMoney(spend.get(m.id) ?? 0)}</dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button size="sm" className="flex-[1_1_120px]" onClick={() => logService(m.id)}>
                        <Wrench /> Log service
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}>
                        <Pencil /> Edit
                      </Button>
                      <DeleteButton onDelete={() => remove(m)} itemName={m.name} entityType="Machine" buttonSize="icon" buttonVariant="ghost" />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <section aria-labelledby="history-h" className="surface p-5 pb-2 md:p-6 md:pb-2">
              <div className="mb-1 flex items-center gap-3">
                <h2 id="history-h" className="text-xl font-bold">
                  Service history
                </h2>
                <Button variant="ghost" size="sm" className="ms-auto" asChild>
                  <Link to="/dashboard/reports">
                    <FileText /> Equipment report
                  </Link>
                </Button>
              </div>
              {records.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground">No services logged yet.</p>
              ) : (
                <ol>
                  {records.map((r) => {
                    const d = parseISO(r.maintenance_date);
                    return (
                      <li key={r.id} className="flex items-center gap-3.5 border-t border-muted py-3 first:border-t-0">
                        <span className="flex w-[56px] shrink-0 flex-col items-center rounded-[10px] bg-background py-1.5">
                          <span className="font-mono text-[11px] uppercase text-muted-foreground">{format(d, 'MMM yy')}</span>
                          <span className="font-display text-xl font-bold leading-tight">{format(d, 'd')}</span>
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-[15px] font-semibold">
                            {r.maintenance_type} · {r.equipment?.name ?? 'Machine'}
                          </span>
                          <span className="truncate text-[13px] text-muted-foreground">{[r.performed_by, r.notes].filter(Boolean).join(' · ') || 'No notes'}</span>
                        </span>
                        <span className="font-mono text-sm">{formatMoney(Number(r.cost ?? 0))}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <AddEquipmentForm
          farmId={farmId}
          onSuccess={() => {
            setAddOpen(false);
            refresh();
            toast({ title: 'Machine added' });
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>

      {editing && (
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <EditEquipmentForm
            equipment={editing}
            onSuccess={() => {
              setEditing(null);
              refresh();
              toast({ title: 'Machine updated' });
            }}
            onCancel={() => setEditing(null)}
          />
        </Dialog>
      )}

      {farmId && <MaintenanceDialog farmId={farmId} equipment={machines} equipmentId={serviceFor} open={serviceOpen} onOpenChange={setServiceOpen} />}
    </div>
  );
};

export default EquipmentPage;
