import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { BarChart3, Loader2, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_PROPS, CHART, GRID_PROPS, TOOLTIP_PROPS } from '@/lib/chartPalette';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCTION_TYPES, animalLabel, dailyProduction, productionTotal } from '@/lib/livestockRecords';
import type { Animal } from './HealthRecordsCard';

const WHOLE_FARM = 'whole_farm';

interface ProductionCardProps {
  farmId: string;
  animals: Animal[];
}

const emptyForm = () => ({
  livestock_id: WHOLE_FARM,
  production_type: 'milk',
  production_date: format(new Date(), 'yyyy-MM-dd'),
  quantity: '',
  unit: PRODUCTION_TYPES.milk,
  notes: '',
});

const ProductionCard: React.FC<ProductionCardProps> = ({ farmId, animals }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [chartType, setChartType] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['livestock_production', farmId],
    queryFn: async () => {
      const since = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('livestock_production')
        .select('*')
        .eq('farm_id', farmId)
        .gte('production_date', since)
        .order('production_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const types = useMemo(() => Array.from(new Set(entries.map((e) => e.production_type))).sort(), [entries]);
  const activeType = chartType && types.includes(chartType) ? chartType : types[0];
  const unit = entries.find((e) => e.production_type === activeType)?.unit ?? '';
  const series = useMemo(() => (activeType ? dailyProduction(entries, activeType, 30) : []), [entries, activeType]);
  const animalsById = useMemo(() => new Map(animals.map((a) => [a.id, a])), [animals]);

  const set = (key: keyof ReturnType<typeof emptyForm>) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const setType = (type: string) => setForm((f) => ({ ...f, production_type: type, unit: PRODUCTION_TYPES[type] ?? f.unit }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ title: 'Enter a quantity greater than zero', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('livestock_production').insert({
      farm_id: farmId,
      livestock_id: form.livestock_id === WHOLE_FARM ? null : form.livestock_id,
      production_type: form.production_type,
      production_date: form.production_date,
      quantity,
      unit: form.unit.trim() || 'units',
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save entry', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['livestock_production', farmId] });
    setChartType(form.production_type);
    toast({ title: 'Production logged' });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Production</CardTitle>
          <CardDescription>Milk, eggs, wool and weight over time</CardDescription>
        </div>
        <Button size="sm" className="gap-2" onClick={() => { setForm(emptyForm()); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Log production
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : !activeType ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <BarChart3 className="h-8 w-8 opacity-50" />
            <p>No production logged in the last 90 days. Log a day's milk or eggs for the whole herd or a single animal.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Select value={activeType} onValueChange={setChartType}>
                <SelectTrigger className="w-[140px] capitalize" aria-label="Production type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-4 text-sm">
                <span>7 days: <strong>{productionTotal(entries, activeType, 7).toLocaleString()} {unit}</strong></span>
                <span>30 days: <strong>{productionTotal(entries, activeType, 30).toLocaleString()} {unit}</strong></span>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis {...AXIS_PROPS} dataKey="label" interval={6} />
                  <YAxis {...AXIS_PROPS} width={40} />
                  <Tooltip {...TOOLTIP_PROPS} formatter={(v) => [`${v} ${unit}`, activeType]} />
                  <Bar dataKey="quantity" fill={CHART.single} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="max-h-40 divide-y overflow-y-auto text-sm">
              {entries.slice(0, 20).map((e) => (
                <li key={e.id} className="flex justify-between gap-2 py-1.5">
                  <span>
                    <span className="capitalize">{e.production_type}</span>
                    <span className="text-muted-foreground"> · {animalLabel(e.livestock_id ? animalsById.get(e.livestock_id) : null)}</span>
                  </span>
                  <span className="whitespace-nowrap">
                    {Number(e.quantity).toLocaleString()} {e.unit}
                    <span className="text-muted-foreground"> · {format(parseISO(e.production_date), 'dd MMM')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Log production</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>From</Label>
                <Select value={form.livestock_id} onValueChange={set('livestock_id')}>
                  <SelectTrigger aria-label="Animal"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WHOLE_FARM}>Whole herd / flock</SelectItem>
                    {animals.map((a) => <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={form.production_type} onValueChange={setType}>
                  <SelectTrigger aria-label="Product"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(PRODUCTION_TYPES).map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-date">Date</Label>
                <Input id="prod-date" type="date" required value={form.production_date} onChange={(e) => set('production_date')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-qty">Quantity</Label>
                <Input id="prod-qty" type="number" min="0" step="any" inputMode="decimal" required value={form.quantity} onChange={(e) => set('quantity')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-unit">Unit</Label>
                <Input id="prod-unit" value={form.unit} onChange={(e) => set('unit')(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="prod-notes">Notes</Label>
                <Input id="prod-notes" value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProductionCard;
