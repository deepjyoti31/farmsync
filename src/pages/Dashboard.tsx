import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { addDays, endOfMonth, format, startOfDay, startOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFarmMembers } from '@/hooks/useFarmMembers';
import { useFarmScope } from '@/hooks/useFarmScope';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/common/PageHeader';
import FarmSelector from '@/components/farms/FarmSelector';
import AddFarmForm from '@/components/farms/AddFarmForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, VisuallyHidden } from '@/components/ui/dialog';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import DueToday from '@/components/dashboard/DueToday';
import FieldsGlance, { type GlanceField } from '@/components/dashboard/FieldsGlance';
import SeasonProgress, { type SeasonRow } from '@/components/dashboard/SeasonProgress';
import SetupChecklist from '@/components/dashboard/SetupChecklist';
import { KpiTile, MandiToday, MoneyThisMonth, NeedsAttention } from '@/components/dashboard/SideCards';
import { setTaskCompleted, type TaskRow } from '@/components/tasks/taskApi';
import { attentionItems, cropProgress, fieldStage, greetingKey, monthTotals } from '@/lib/dashboard';
import { animalLabel, upcomingHealthDue } from '@/lib/livestockRecords';
import { summarizeCommodities, toMarketPrice } from '@/lib/marketPrices';
import { dueState } from '@/lib/tasks';
import { totalAreaIn } from '@/lib/yieldAnalytics';

const FARM_KEY = 'farmsync.dashboard.farm';
/** Tasks listed in the "Due today" card; the counts above it cover every task. */
const DUE_TODAY_ROWS = 8;

const readStoredFarm = () => {
  try {
    return localStorage.getItem(FARM_KEY);
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const { user, currentOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(readStoredFarm);
  const [addFarmOpen, setAddFarmOpen] = useState(false);

  const now = new Date();

  const scope = useFarmScope();
  // Pending also covers the wait for the workspaces, before the query starts.
  const { data: farms = [], isPending: loadingFarms } = useQuery({
    queryKey: ['farms', 'dashboard', scope.key],
    enabled: scope.ready,
    queryFn: async () => {
      const { data, error } = await scope.apply(supabase.from('farms').select('id, name, village, district, state'));
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fall back to the first farm when nothing (or a farm that is gone) is selected.
  useEffect(() => {
    if (loadingFarms) return;
    if (farms.length > 0 && !farms.some((f) => f.id === selectedFarmId)) setSelectedFarmId(farms[0].id);
  }, [farms, loadingFarms, selectedFarmId]);

  useEffect(() => {
    if (!selectedFarmId) return;
    try {
      localStorage.setItem(FARM_KEY, selectedFarmId);
    } catch {
      /* storage can be unavailable in private windows */
    }
  }, [selectedFarmId]);

  const farmId = farms.some((f) => f.id === selectedFarmId) ? selectedFarmId : null;
  const enabled = !!farmId;

  const { data: fields = [], isLoading: loadingFields } = useQuery({
    queryKey: ['fields', farmId, 'dashboard'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('fields').select('id, name, area, area_unit, boundaries').eq('farm_id', farmId!).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const fieldIds = fields.map((f) => f.id);
  const { data: plantings = [] } = useQuery({
    queryKey: ['field_crops', farmId, 'dashboard', fieldIds.join(',')],
    enabled: enabled && fieldIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_crops')
        .select('id, field_id, name, planting_date, expected_harvest_date, actual_harvest_date, status, crop:crops(name, variety)')
        .in('field_id', fieldIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', farmId, 'today'],
    enabled,
    queryFn: async () => {
      const soon = format(addDays(new Date(), 3), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('farm_id', farmId!)
        .or(`and(status.not.in.(completed,cancelled),due_date.lte.${soon}),completed_at.gte."${startOfDay(new Date()).toISOString()}"`)
        // No row limit: the counts in the headline and the KPI tile come from
        // this list. The date filter keeps it short; the card shows the first few.
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as TaskRow[];
    },
  });

  const { data: animalCount = 0 } = useQuery({
    queryKey: ['livestock', farmId, 'count'],
    enabled,
    queryFn: async () => {
      // Animals on the farm now, not ones sold or dead.
      const { count } = await supabase
        .from('livestock')
        .select('id', { count: 'exact', head: true })
        .eq('farm_id', farmId!)
        .or('status.is.null,status.eq.active');
      return count ?? 0;
    },
  });

  const { data: money } = useQuery({
    queryKey: ['financial_transactions', farmId, 'month', format(now, 'yyyy-MM')],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('amount, type, category:financial_categories(name, type)')
        .eq('farm_id', farmId!)
        .gte('transaction_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
        // Entries dated later this year are not "this month so far".
        .lte('transaction_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));
      if (error) return monthTotals([]);
      return monthTotals(data ?? []);
    },
  });

  const { data: attention = [] } = useQuery({
    queryKey: ['attention', farmId],
    enabled,
    queryFn: async () => {
      const [stock, equipment, health] = await Promise.all([
        supabase.from('inventory').select('name, quantity, minimum_stock, unit, expiry_date').eq('farm_id', farmId!),
        supabase.from('equipment').select('name, next_maintenance_date').eq('farm_id', farmId!),
        supabase
          .from('livestock_health_records')
          .select('id, livestock_id, record_type, record_date, next_due_date, livestock!inner(farm_id, status, tag_id, breed, livestock_type:livestock_types(name))')
          .eq('livestock.farm_id', farmId!)
          .order('record_date', { ascending: false })
          .limit(200),
      ]);
      const live = (health.data ?? []).filter((r) => {
        const status = (r.livestock as { status?: string | null } | null)?.status;
        return !status || status === 'active';
      });
      const due = upcomingHealthDue(live).map(({ record, daysUntilDue }) => ({
        label: animalLabel(record.livestock as Parameters<typeof animalLabel>[0]),
        recordType: record.record_type.charAt(0).toUpperCase() + record.record_type.slice(1),
        daysUntilDue,
      }));
      return attentionItems({ stock: stock.data ?? [], equipment: equipment.data ?? [], health: due });
    },
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['market_data', 'dashboard'],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.from('market_data').select('*').order('price_date', { ascending: false }).limit(300);
      if (error) return [];
      return summarizeCommodities((data ?? []).map(toMarketPrice), 4);
    },
  });

  const { data: teamSize = 1 } = useQuery({
    queryKey: ['organization_members', currentOrganization?.id, 'count'],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from('organization_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization!.id);
      return count ?? 1;
    },
  });

  const { data: members = [] } = useFarmMembers(farmId);
  const memberNames = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  // A second tap before the first save returns would create the next
  // occurrence of a repeating task twice: both saves see that none exists yet.
  const toggling = useRef(new Set<string>());
  const handleToggle = async (task: TaskRow, completed: boolean) => {
    if (toggling.current.has(task.id)) return;
    toggling.current.add(task.id);
    try {
      await setTaskCompleted(task, completed);
      // Wait for the refreshed list, so the next tap acts on the new status.
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (e) {
      toast({ title: t('today.due.error', 'Could not update the task'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      toggling.current.delete(task.id);
    }
  };

  const plantingsByField = useMemo(() => {
    const map = new Map<string, typeof plantings>();
    for (const p of plantings) map.set(p.field_id, [...(map.get(p.field_id) ?? []), p]);
    return map;
  }, [plantings]);

  const cropName = (p: (typeof plantings)[number]) => p.crop?.name || p.name || t('today.season.crop', 'Crop');

  const seasonRows: SeasonRow[] = plantings
    .map((p) => ({ p, progress: cropProgress(p, now) }))
    .filter(({ progress }) => progress.stage !== 'harvested')
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .slice(0, 5)
    .map(({ p, progress }) => {
      const field = fields.find((f) => f.id === p.field_id);
      return {
        id: p.id,
        name: [cropName(p), p.crop?.variety].filter(Boolean).join(' · '),
        where: field ? `${field.name} · ${field.area} ${field.area_unit}` : '',
        plantingDate: p.planting_date,
        expectedHarvest: p.expected_harvest_date,
        progress,
      };
    });

  const glanceFields: GlanceField[] = fields.map((f) => {
    const list = plantingsByField.get(f.id) ?? [];
    const live = list
      .map((p) => ({ p, prog: cropProgress(p, now) }))
      .filter(({ prog }) => prog.stage !== 'harvested')
      .sort((a, b) => b.prog.percent - a.prog.percent)[0];
    const summary = live
      ? live.prog.stage === 'planned'
        ? `${cropName(live.p)} · ${t('today.fields.planned', 'Planned').toLowerCase()}`
        : `${cropName(live.p)} · ${t('today.season.day', { day: live.prog.day, defaultValue: 'Day {{day}}' }).toLowerCase()}`
      : t('today.fields.empty', 'Nothing planted');
    return { id: f.id, name: f.name, area: f.area, areaUnit: f.area_unit, boundaries: f.boundaries, stage: fieldStage(list, now), summary };
  });

  const stages = plantings.map((p) => cropProgress(p, now).stage);
  const growing = stages.filter((s) => s === 'growing' || s === 'ready').length;
  const planned = stages.filter((s) => s === 'planned').length;
  // Fields can be measured in different units: convert before adding them up.
  const areaUnit = fields[0]?.area_unit ?? '';
  const totalArea = totalAreaIn(fields, areaUnit) ?? fields.reduce((s, f) => s + (Number(f.area) || 0), 0);
  const openTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
  const dueNow = openTasks.filter((task) => ['overdue', 'today'].includes(dueState(task.due_date))).length;
  const late = openTasks.filter((task) => dueState(task.due_date) === 'overdue').length;

  const firstName = (user?.user_metadata?.first_name as string | undefined) || user?.email?.split('@')[0] || '';
  const part = greetingKey(now);
  const greeting = t(`today.greeting.${part}`, {
    name: firstName,
    defaultValue: { morning: 'Good morning, {{name}}', afternoon: 'Good afternoon, {{name}}', evening: 'Good evening, {{name}}' }[part],
  });
  const dateLabel = now.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
  const currentFarm = farms.find((f) => f.id === farmId);

  const subline = !farmId
    ? t('today.sub_new', "Let's get your farm on the map.")
    : dueNow === 0
      ? t('today.sub_clear', 'Nothing is due today.')
      : late > 0
        ? t('today.sub_due_late', { count: dueNow, late, defaultValue: '{{count}} things to do today, {{late}} of them late.' })
        : t('today.sub_due', { count: dueNow, defaultValue: '{{count}} things to do today.' });

  const needsSetup = !!farmId && !loadingFields && (fields.length === 0 || plantings.length === 0);

  if (loadingFarms) {
    return (
      <div className="flex h-[50vh] items-center justify-center" role="status" aria-label={t('common.loading')}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        className="mb-0"
        eyebrow={[dateLabel, currentFarm?.name].filter(Boolean).join(' · ')}
        title={farms.length === 0 ? t('today.welcome', { name: firstName, defaultValue: 'Welcome to FarmSync, {{name}}' }) : greeting}
        description={subline}
        actions={farms.length > 0 ? <FarmSelector selectedFarmId={farmId} onFarmChange={setSelectedFarmId} /> : undefined}
      />

      {farms.length === 0 ? (
        <SetupChecklist hasFarm={false} hasFields={false} hasCrops={false} hasTeam={teamSize > 1} onAddFarm={() => setAddFarmOpen(true)} />
      ) : (
        <>
          {needsSetup && (
            <SetupChecklist compact hasFarm hasFields={fields.length > 0} hasCrops={plantings.length > 0} hasTeam={teamSize > 1} onAddFarm={() => setAddFarmOpen(true)} />
          )}

          <WeatherWidget farmId={farmId} />

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-6">
              <DueToday tasks={tasks} limit={DUE_TODAY_ROWS} memberNames={memberNames} onToggle={handleToggle} />
              {fields.length > 0 && <FieldsGlance fields={glanceFields} />}
              <SeasonProgress rows={seasonRows} />
            </div>

            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                <KpiTile
                  label={t('dashboard.stats.fields.title')}
                  value={String(fields.length)}
                  note={totalArea > 0 ? `${Math.round(totalArea * 10) / 10} ${areaUnit}` : undefined}
                />
                <KpiTile
                  label={t('today.kpi.growing', 'Crops growing')}
                  value={String(growing)}
                  note={planned > 0 ? t('today.kpi.planned', { count: planned, defaultValue: '{{count}} planned' }) : undefined}
                />
                <KpiTile label={t('dashboard.stats.livestock.title')} value={String(animalCount)} note={t('dashboard.stats.livestock.description')} />
                <KpiTile label={t('today.kpi.open', 'Open tasks')} value={String(openTasks.length)} note={t('today.kpi.next_days', 'today and next 3 days')} />
              </div>
              {money && <MoneyThisMonth totals={money} monthLabel={now.toLocaleDateString(i18n.language, { month: 'long' })} />}
              <NeedsAttention items={attention} />
              <MandiToday prices={prices} />
            </div>
          </div>
        </>
      )}

      <Dialog open={addFarmOpen} onOpenChange={setAddFarmOpen}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>{t('today.setup.add_farm', 'Add your farm')}</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription>{t('today.setup.farm_detail', 'Name, village and total area')}</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <AddFarmForm
            onClose={() => setAddFarmOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['farms'] });
              setAddFarmOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
