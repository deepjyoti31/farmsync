import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateByIdOrThrow } from '@/utils/deleteUtils';
import { MAINTENANCE_TYPES } from '@/lib/maintenance';

interface EquipmentOption {
  id: string;
  name: string;
  status: string | null;
  next_maintenance_date: string | null;
}

interface MaintenanceDialogProps {
  farmId: string;
  equipment: EquipmentOption[];
  /** Machine to preselect. */
  equipmentId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'log' | 'schedule';

const today = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Log a completed service (optionally recording its cost as a farm expense)
 * or just set when the next service is due.
 */
const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({ farmId, equipment, equipmentId, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('log');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    equipment_id: '',
    maintenance_date: today(),
    maintenance_type: MAINTENANCE_TYPES[0] as string,
    cost: '',
    performed_by: '',
    notes: '',
    next_due: '',
    record_expense: true,
  });

  useEffect(() => {
    if (!open) return;
    const id = equipmentId ?? equipment[0]?.id ?? '';
    const current = equipment.find((e) => e.id === id);
    setMode('log');
    setForm({
      equipment_id: id,
      maintenance_date: today(),
      maintenance_type: MAINTENANCE_TYPES[0],
      cost: '',
      performed_by: '',
      notes: '',
      // Keep an upcoming date; replace a missing or already-passed one with six months out.
      next_due:
        current?.next_maintenance_date && current.next_maintenance_date > today()
          ? current.next_maintenance_date
          : format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
      record_expense: true,
    });
  }, [open, equipmentId, equipment]);

  const set = (key: keyof typeof form) => (value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const recordExpense = async (name: string, cost: number) => {
    const { data: category } = await supabase
      .from('financial_categories')
      .select('id')
      .is('user_id', null)
      .eq('name', 'Equipment & Repairs')
      .maybeSingle();
    const { error } = await supabase.from('financial_transactions').insert({
      farm_id: farmId,
      amount: cost,
      type: 'expense',
      category_id: category?.id ?? null,
      transaction_date: form.maintenance_date,
      description: `${form.maintenance_type}: ${name}`,
    });
    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const machine = equipment.find((m) => m.id === form.equipment_id);
    if (!machine) {
      toast({ title: 'Choose a machine', variant: 'destructive' });
      return;
    }
    const cost = form.cost ? Number(form.cost) : null;
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      toast({ title: 'Cost must be zero or more', variant: 'destructive' });
      return;
    }
    if (mode === 'log' && form.next_due && form.next_due <= form.maintenance_date) {
      toast({ title: 'Next service must be after this one', variant: 'destructive' });
      return;
    }
    if (mode === 'schedule' && !form.next_due) {
      toast({ title: 'Pick the next service date', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'log') {
        const { error } = await supabase.from('equipment_maintenance').insert({
          equipment_id: machine.id,
          maintenance_date: form.maintenance_date,
          maintenance_type: form.maintenance_type,
          cost,
          performed_by: form.performed_by.trim() || null,
          notes: form.notes.trim() || null,
        });
        if (error) throw error;

        const repaired = machine.status === 'needs maintenance' || machine.status === 'in repair';
        await updateByIdOrThrow('equipment', machine.id, {
            last_maintenance_date: form.maintenance_date,
            next_maintenance_date: form.next_due || null,
            ...(repaired ? { status: 'operational' } : {}),
          }, 'This machine');

        if (form.record_expense && cost) await recordExpense(machine.name, cost);
      } else {
        await updateByIdOrThrow('equipment', machine.id, { next_maintenance_date: form.next_due }, 'This machine');
      }

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment_maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });
      toast({ title: mode === 'log' ? 'Service logged' : 'Next service scheduled' });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Could not save', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Maintenance</DialogTitle>
          <DialogDescription>Record work done on a machine, or set when it is next due.</DialogDescription>
        </DialogHeader>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Log a service</TabsTrigger>
            <TabsTrigger value="schedule">Schedule next</TabsTrigger>
          </TabsList>
        </Tabs>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Machine</Label>
            <Select value={form.equipment_id} onValueChange={(v) => set('equipment_id')(v)}>
              <SelectTrigger aria-label="Machine"><SelectValue placeholder="Choose a machine" /></SelectTrigger>
              <SelectContent>
                {equipment.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {mode === 'log' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mt-date">Date</Label>
                <Input id="mt-date" type="date" required value={form.maintenance_date} onChange={(e) => set('maintenance_date')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Work done</Label>
                <Select value={form.maintenance_type} onValueChange={(v) => set('maintenance_type')(v)}>
                  <SelectTrigger aria-label="Work done"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mt-cost">Cost (₹)</Label>
                <Input id="mt-cost" type="number" min="0" step="any" inputMode="decimal" value={form.cost} onChange={(e) => set('cost')(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mt-by">Done by</Label>
                <Input id="mt-by" placeholder="Mechanic or workshop" value={form.performed_by} onChange={(e) => set('performed_by')(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mt-notes">Notes</Label>
                <Textarea id="mt-notes" rows={2} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Checkbox
                  id="mt-expense"
                  checked={form.record_expense}
                  onCheckedChange={(c) => set('record_expense')(c === true)}
                />
                <Label htmlFor="mt-expense" className="font-normal">Add the cost to Finances as an expense</Label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mt-next">Next service due{mode === 'log' && ' (optional)'}</Label>
            <Input id="mt-next" type="date" value={form.next_due} onChange={(e) => set('next_due')(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'log' ? 'Save service' : 'Save date'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceDialog;
