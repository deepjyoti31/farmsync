import React, { useState } from 'react';
import { addDays, format } from 'date-fns';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateCoopItemDialogProps {
  kind: 'order' | 'batch';
  organizationId: string;
  onCreated: () => void;
}

/** Start a group purchase (bulk order) or a produce batch for the current co-op. Owners and admins only (enforced by RLS). */
const CreateCoopItemDialog: React.FC<CreateCoopItemDialogProps> = ({ kind, organizationId, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(() => format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [cropName, setCropName] = useState('');

  const reset = () => {
    setTitle('');
    setCropName('');
    setDeadline(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = title.trim();
    if (!name || (kind === 'batch' && !cropName.trim())) {
      toast({ title: 'Fill in every field', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } =
      kind === 'order'
        ? await supabase.from('bulk_orders').insert({
            organization_id: organizationId,
            title: name,
            // End of the chosen day in local time.
            deadline: new Date(`${deadline}T23:59:59`).toISOString(),
          })
        : await supabase.from('produce_batches').insert({
            organization_id: organizationId,
            batch_number: name,
            crop_name: cropName.trim(),
          });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: kind === 'order' ? 'Bulk order created' : 'Batch created' });
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {kind === 'order' ? 'Create Order' : 'Create Batch'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{kind === 'order' ? 'New bulk order' : 'New produce batch'}</DialogTitle>
          <DialogDescription>
            {kind === 'order' ? 'Members can commit to the order until the deadline.' : 'Collect produce from members under one batch number.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coop-title">{kind === 'order' ? 'Title' : 'Batch number'}</Label>
            <Input
              id="coop-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'order' ? 'e.g. Kharif seed and fertiliser' : 'e.g. WHT-2026-01'}
              maxLength={120}
              required
            />
          </div>
          {kind === 'order' ? (
            <div className="space-y-2">
              <Label htmlFor="coop-deadline">Deadline</Label>
              <Input id="coop-deadline" type="date" value={deadline} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setDeadline(e.target.value)} required />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="coop-crop">Crop</Label>
              <Input id="coop-crop" value={cropName} onChange={(e) => setCropName(e.target.value)} placeholder="e.g. Wheat" maxLength={80} required />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCoopItemDialog;
