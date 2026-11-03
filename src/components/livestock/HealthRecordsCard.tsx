import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, Heart, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HEALTH_RECORD_TYPES, animalLabel, upcomingHealthDue, type AnimalLike } from '@/lib/livestockRecords';

export interface Animal extends AnimalLike {
  id: string;
}

interface HealthRecordsCardProps {
  farmId: string;
  animals: Animal[];
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = () => ({
  livestock_id: '',
  record_type: 'vaccination',
  record_date: today(),
  description: '',
  medicine: '',
  dosage: '',
  administered_by: '',
  cost: '',
  next_due_date: '',
});

const HealthRecordsCard: React.FC<HealthRecordsCardProps> = ({ farmId, animals }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['livestock_health_records', farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livestock_health_records')
        .select('*, livestock!inner(farm_id)')
        .eq('livestock.farm_id', farmId)
        .order('record_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const animalsById = useMemo(() => new Map(animals.map((a) => [a.id, a])), [animals]);
  const reminders = useMemo(() => upcomingHealthDue(records), [records]);

  const set = (key: keyof ReturnType<typeof emptyForm>) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const openDialog = () => {
    setForm({ ...emptyForm(), livestock_id: animals[0]?.id ?? '' });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.livestock_id) {
      toast({ title: 'Choose an animal', variant: 'destructive' });
      return;
    }
    if (form.next_due_date && form.next_due_date <= form.record_date) {
      toast({ title: 'Next due date must be after the record date', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('livestock_health_records').insert({
      livestock_id: form.livestock_id,
      record_type: form.record_type,
      record_date: form.record_date,
      description: form.description.trim() || null,
      medicine: form.medicine.trim() || null,
      dosage: form.dosage.trim() || null,
      administered_by: form.administered_by.trim() || null,
      cost: form.cost ? Number(form.cost) : null,
      next_due_date: form.next_due_date || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save record', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['livestock_health_records', farmId] });
    toast({ title: 'Health record added' });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Health Records</CardTitle>
          <CardDescription>Vaccinations, treatments and check-ups</CardDescription>
        </div>
        <Button size="sm" className="gap-2" onClick={openDialog} disabled={animals.length === 0}>
          <Plus className="h-4 w-4" /> Add record
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.length > 0 && (
          <div className="rounded-md border border-harvest/50 bg-warning-tint p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" /> Due in the next two weeks
            </p>
            <ul className="space-y-1 text-sm">
              {reminders.map(({ record, daysUntilDue }) => (
                <li key={record.id} className="flex justify-between gap-2">
                  <span className="capitalize">
                    {record.record_type}: {animalLabel(animalsById.get(record.livestock_id))}
                  </span>
                  <span className={daysUntilDue < 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                    {daysUntilDue < 0
                      ? `${-daysUntilDue}d overdue`
                      : daysUntilDue === 0
                        ? 'Today'
                        : format(parseISO(record.next_due_date!), 'dd MMM')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
            <Heart className="h-8 w-8 opacity-50" />
            <p>No health records yet. Log a vaccination or treatment to start a history and get reminders.</p>
          </div>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {records.slice(0, 50).map((r) => (
              <li key={r.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{animalLabel(animalsById.get(r.livestock_id))}</span>
                  <span className="text-muted-foreground">{format(parseISO(r.record_date), 'dd MMM yyyy')}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="capitalize">{r.record_type}</Badge>
                  {r.medicine && <span>{r.medicine}{r.dosage ? `, ${r.dosage}` : ''}</span>}
                  {r.description && <span>{r.description}</span>}
                  {r.next_due_date && <span>Next: {format(parseISO(r.next_due_date), 'dd MMM yyyy')}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add health record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Animal</Label>
                <Select value={form.livestock_id} onValueChange={set('livestock_id')}>
                  <SelectTrigger aria-label="Animal"><SelectValue placeholder="Choose an animal" /></SelectTrigger>
                  <SelectContent>
                    {animals.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{animalLabel(a)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.record_type} onValueChange={set('record_type')}>
                  <SelectTrigger aria-label="Record type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HEALTH_RECORD_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr-date">Date</Label>
                <Input id="hr-date" type="date" required value={form.record_date} onChange={(e) => set('record_date')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr-medicine">Medicine or vaccine</Label>
                <Input id="hr-medicine" value={form.medicine} onChange={(e) => set('medicine')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr-dosage">Dosage</Label>
                <Input id="hr-dosage" value={form.dosage} onChange={(e) => set('dosage')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr-by">Given by</Label>
                <Input id="hr-by" value={form.administered_by} onChange={(e) => set('administered_by')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hr-cost">Cost (₹)</Label>
                <Input id="hr-cost" type="number" min="0" step="any" inputMode="decimal" value={form.cost} onChange={(e) => set('cost')(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hr-next">Next due (optional)</Label>
                <Input id="hr-next" type="date" value={form.next_due_date} onChange={(e) => set('next_due_date')(e.target.value)} />
                <p className="text-xs text-muted-foreground">Booster, follow-up treatment or next check-up. You will see a reminder two weeks before.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hr-notes">Notes</Label>
                <Textarea id="hr-notes" rows={2} value={form.description} onChange={(e) => set('description')(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HealthRecordsCard;
