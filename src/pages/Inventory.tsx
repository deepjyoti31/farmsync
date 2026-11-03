import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarClock, Download, Loader2, Package, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import { DeleteButton } from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import { KpiTile } from '@/components/dashboard/SideCards';
import AddInventoryForm from '@/components/inventory/AddInventoryForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatMoney } from '@/lib/dashboard';
import { downloadCsv, toCsv } from '@/lib/csv';
import { EXPIRY_WARNING_DAYS, stockState, stockValue, type StockState } from '@/lib/inventoryStatus';
import { deleteEntity } from '@/utils/deleteUtils';
import { cn } from '@/lib/utils';

type Show = 'all' | 'attention';
const ALL = 'all';

const qtyText = (q: number, unit: string | null) => `${Number(q).toLocaleString('en-IN')} ${unit || 'units'}`;

const StateBadge = ({ state }: { state: StockState }) => (
  <span className="flex flex-wrap gap-1.5">
    {state.out && <Badge variant="destructive">Out of stock</Badge>}
    {state.low && <Badge variant="warning">Low stock</Badge>}
    {state.expiry === 'expired' && <Badge variant="destructive">Expired</Badge>}
    {state.expiry === 'soon' && <Badge variant="warning">Expires in {state.daysToExpiry} d</Badge>}
  </span>
);

const Inventory = () => {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [show, setShow] = useState<Show>('all');
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_categories').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory').select('*, category:category_id(id, name, type)').eq('farm_id', farmId!).order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => items.map((i) => ({ ...i, state: stockState(i) })), [items]);
  const attention = rows.filter((r) => r.state.needsAttention).sort((a, b) => Number(b.state.out) - Number(a.state.out) || (a.state.daysToExpiry ?? 9999) - (b.state.daysToExpiry ?? 9999));
  const lowCount = rows.filter((r) => r.state.low || r.state.out).length;
  const expiringCount = rows.filter((r) => r.state.expiry).length;
  const value = stockValue(items);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (show === 'attention' && !r.state.needsAttention) return false;
      if (category !== ALL && r.category_id !== category) return false;
      if (q && !`${r.name} ${r.storage_location ?? ''} ${r.description ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, show, category, query]);

  const remove = async (id: string) => {
    await deleteEntity({ id, entityType: 'inventory', onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }) });
  };

  const exportCsv = () => {
    downloadCsv(
      `farmsync-inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      toCsv(
        ['Item', 'Category', 'Quantity', 'Unit', 'Reorder level', 'Location', 'Expiry', 'Purchase price'],
        visible.map((r) => [r.name, r.category?.name ?? '', r.quantity, r.unit ?? '', r.minimum_stock ?? '', r.storage_location ?? '', r.expiry_date ?? '', r.purchase_price ?? '']),
      ),
    );
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Seed, fertiliser, feed and other supplies, with reorder levels and expiry dates."
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button disabled={!farmId} onClick={() => setAddOpen(true)}>
              <Plus /> Add an item
            </Button>
          </>
        }
      />

      {!farmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading inventory">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <Package className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">Nothing in store yet</h2>
          <p className="max-w-sm text-muted-foreground">Add what you keep in stock and set a reorder level, and FarmSync will warn you before you run out.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add the first item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <KpiTile label="Items" value={String(items.length)} note={`${categories.length > 0 ? new Set(items.map((i) => i.category_id).filter(Boolean)).size : 0} categories`} />
            <KpiTile label="Low or out" value={String(lowCount)} note={lowCount > 0 ? 'at or below reorder level' : 'all above reorder level'} />
            <KpiTile label="Expiring" value={String(expiringCount)} note={`expired or within ${EXPIRY_WARNING_DAYS} days`} />
            <KpiTile label="Stock value" value={value > 0 ? formatMoney(value) : '·'} note={value > 0 ? 'at purchase price' : 'add purchase prices to see this'} />
          </div>

          {attention.length > 0 && (
            <section aria-labelledby="attention-h" className="surface p-5 md:p-6">
              <h2 id="attention-h" className="mb-3 text-xl font-bold">
                Needs attention
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {attention.slice(0, 6).map((r) => (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl border p-3.5">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]',
                        r.state.out || r.state.expiry === 'expired' ? 'bg-rust-tint text-rust' : 'bg-warning-tint text-warning',
                      )}
                    >
                      {r.state.expiry ? <CalendarClock className="h-[18px] w-[18px]" aria-hidden="true" /> : <AlertTriangle className="h-[18px] w-[18px]" aria-hidden="true" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-[15px] font-semibold">{r.name}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {qtyText(r.quantity, r.unit)}
                        {r.minimum_stock !== null && ` · reorder at ${r.minimum_stock}`}
                        {r.expiry_date && ` · expires ${format(parseISO(r.expiry_date), 'd MMM')}`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="stock-h" className="surface overflow-hidden">
            <div className="flex flex-wrap items-center gap-2.5 px-5 pb-3 pt-5 md:px-6">
              <h2 id="stock-h" className="me-auto text-xl font-bold">
                Stock
              </h2>
              <label className="flex h-10 min-w-[200px] items-center gap-2 rounded-[10px] border border-input bg-card px-2.5 text-muted-foreground focus-within:border-primary">
                <Search className="h-4 w-4" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items"
                  aria-label="Search items"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                />
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 w-[170px] text-sm" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Segmented
                label="Show"
                value={show}
                onChange={setShow}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'attention', label: `Needs attention · ${attention.length}` },
                ]}
              />
            </div>
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-5 md:ps-6">Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[220px]">Stock level</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="w-12 pe-5 md:pe-6">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="ps-5 md:ps-6">
                      <span className="flex flex-col gap-1">
                        <span className="font-semibold">{r.name}</span>
                        {r.storage_location && <span className="text-[13px] text-muted-foreground">{r.storage_location}</span>}
                        <StateBadge state={r.state} />
                      </span>
                    </TableCell>
                    <TableCell>{r.category?.name ? <Badge variant="secondary">{r.category.name}</Badge> : <span className="text-muted-foreground">·</span>}</TableCell>
                    <TableCell>
                      <span className="flex flex-col gap-1.5">
                        <span className="flex justify-between gap-2 font-mono text-[13px]">
                          <span>{qtyText(r.quantity, r.unit)}</span>
                          {r.minimum_stock !== null && <span className="text-muted-foreground">min {r.minimum_stock}</span>}
                        </span>
                        <span
                          role="meter"
                          aria-label={`${r.name} stock`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(r.state.fill)}
                          aria-valuetext={r.state.out ? 'Out of stock' : r.state.low ? 'Below reorder level' : 'In stock'}
                          className="relative h-2 rounded bg-muted"
                        >
                          <span
                            className={cn('absolute inset-y-0 start-0 rounded', r.state.out || r.state.low ? 'bg-chart-expense' : 'bg-chart-income')}
                            style={{ width: `${r.state.fill}%` }}
                          />
                          {r.minimum_stock !== null && <span aria-hidden="true" className="absolute inset-y-[-3px] start-1/2 w-0.5 bg-foreground/40" title="Reorder level" />}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className={cn('font-mono text-[13px]', r.state.expiry === 'expired' ? 'font-medium text-rust' : r.state.expiry === 'soon' ? 'text-warning' : 'text-muted-foreground')}>
                      {r.expiry_date ? format(parseISO(r.expiry_date), 'd MMM yyyy') : '·'}
                    </TableCell>
                    <TableCell className="pe-5 md:pe-6">
                      <DeleteButton onDelete={() => remove(r.id)} itemName={r.name} entityType="Inventory item" buttonSize="icon" buttonVariant="ghost" />
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nothing matches.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center gap-3 border-t border-muted px-5 py-3 text-[13px] text-muted-foreground md:px-6">
              <span>
                {visible.length} of {items.length} items · the mark on each bar is the reorder level
              </span>
              <Button variant="outline" size="sm" className="ms-auto" onClick={exportCsv} disabled={visible.length === 0}>
                <Download /> Export CSV
              </Button>
            </div>
          </section>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add an item</DialogTitle>
          </DialogHeader>
          {farmId && (
            <AddInventoryForm
              farmId={farmId}
              categories={categories}
              onSuccess={() => {
                setAddOpen(false);
                queryClient.invalidateQueries({ queryKey: ['inventory'] });
                toast({ title: 'Item added' });
              }}
              onCancel={() => setAddOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
