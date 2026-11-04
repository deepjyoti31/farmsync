import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type LogKind = 'input' | 'water';

const INPUT_TYPES = ['fertilizer', 'pesticide', 'herbicide', 'fungicide', 'other'] as const;
const WATER_SOURCES = ['well', 'canal', 'rainwater', 'municipal', 'other'] as const;

interface LogEntryDialogProps {
  kind: LogKind;
  farmId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

const emptyForm = () => ({
  field_id: '',
  date: today(),
  type: 'fertilizer' as string,
  product_name: '',
  quantity: '',
  unit: 'kg',
  method: '',
  notes: '',
  source: 'well' as string,
});

/** Record an input applied to a field, or water used on one. These rows feed the audit report and compliance checks. */
const LogEntryDialog: React.FC<LogEntryDialogProps> = ({ kind, farmId, open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: fields = [] } = useQuery({
    queryKey: ['fields', farmId, 'names-only'],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from('fields').select('id, name').eq('farm_id', farmId).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    setForm({ ...emptyForm(), unit: kind === 'water' ? 'litres' : 'kg' });
  }, [open, kind]);

  useEffect(() => {
    if (open && !form.field_id && fields.length > 0) setForm((f) => ({ ...f, field_id: fields[0].id }));
  }, [open, fields, form.field_id]);

  const set = (key: keyof ReturnType<typeof emptyForm>) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(form.quantity);
    if (!form.field_id) {
      toast({ title: 'Choose a field', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ title: 'Enter an amount greater than zero', variant: 'destructive' });
      return;
    }
    if (kind === 'input' && !form.product_name.trim()) {
      toast({ title: 'Enter the product name', variant: 'destructive' });
      return;
    }
    const unit = form.unit.trim() || (kind === 'water' ? 'litres' : 'kg');

    setSaving(true);
    const { error } =
      kind === 'input'
        ? await supabase.from('sustainability_logs').insert({
            field_id: form.field_id,
            log_date: form.date,
            type: form.type,
            product_name: form.product_name.trim(),
            quantity,
            unit,
            method: form.method.trim() || null,
            notes: form.notes.trim() || null,
          })
        : await supabase.from('water_usage').insert({
            field_id: form.field_id,
            usage_date: form.date,
            volume: quantity,
            unit,
            source: form.source,
          });
    setSaving(false);

    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: [kind === 'input' ? 'sustainability_logs' : 'water_usage', farmId] });
    toast({ title: kind === 'input' ? 'Input logged' : 'Water use logged' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{kind === 'input' ? 'Log an input' : 'Log water use'}</DialogTitle>
          <DialogDescription>
            {kind === 'input'
              ? 'Fertiliser, pesticide or other product applied to a field.'
              : 'Irrigation water used on a field.'}
          </DialogDescription>
        </DialogHeader>
        {fields.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Add a field to this farm first. Logs are recorded per field.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Field</Label>
                <Select value={form.field_id} onValueChange={set('field_id')}>
                  <SelectTrigger aria-label="Field"><SelectValue placeholder="Choose a field" /></SelectTrigger>
                  <SelectContent>
                    {fields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-date">Date</Label>
                <Input id="log-date" type="date" value={form.date} max={today()} onChange={(e) => set('date')(e.target.value)} required />
              </div>
              {kind === 'input' ? (
                <>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={set('type')}>
                      <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INPUT_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-product">Product</Label>
                    <Input id="log-product" value={form.product_name} onChange={(e) => set('product_name')(e.target.value)} placeholder="e.g. Urea" maxLength={200} />
                  </div>
                </>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Source</Label>
                  <Select value={form.source} onValueChange={set('source')}>
                    <SelectTrigger aria-label="Source"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WATER_SOURCES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="log-qty">{kind === 'input' ? 'Quantity' : 'Volume'}</Label>
                <Input id="log-qty" type="number" min="0" step="any" inputMode="decimal" value={form.quantity} onChange={(e) => set('quantity')(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-unit">Unit</Label>
                <Input id="log-unit" value={form.unit} onChange={(e) => set('unit')(e.target.value)} maxLength={30} />
              </div>
            </div>
            {kind === 'input' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="log-method">Method</Label>
                  <Input id="log-method" value={form.method} onChange={(e) => set('method')(e.target.value)} placeholder="e.g. Broadcast, foliar spray" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-notes">Notes</Label>
                  <Textarea id="log-notes" rows={2} value={form.notes} onChange={(e) => set('notes')(e.target.value)} />
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LogEntryDialog;
