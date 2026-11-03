import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Download, FileText, Loader2, Plus, Search, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/common/PageHeader';
import Segmented from '@/components/common/Segmented';
import DeleteButton from '@/components/common/DeleteButton';
import FarmSelector from '@/components/farms/FarmSelector';
import AddTransactionForm from '@/components/finances/AddTransactionForm';
import MonthlyChart from '@/components/finances/MonthlyChart';
import { KpiTile } from '@/components/dashboard/SideCards';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/dashboard';
import { getDateRange } from '@/lib/dateRanges';
import { categoryTotals, monthlySeries, transactionType } from '@/lib/financeSummary';
import { toCsv, downloadCsv } from '@/lib/csv';
import { toHectares } from '@/lib/yieldAnalytics';
import { deleteEntity } from '@/utils/deleteUtils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Period = 'this-month' | 'this-quarter' | 'this-year' | 'last-year' | 'all';
type Kind = 'all' | 'income' | 'expense';

const PERIOD_LABEL: Record<Period, string> = {
  'this-month': 'This month',
  'this-quarter': 'This quarter',
  'this-year': 'This year',
  'last-year': 'Last year',
  all: 'All time',
};

const PAGE = 25;

const Finances = () => {
  const [farmId, setFarmId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('this-year');
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['financial_transactions', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*, category:financial_categories(name, type)')
        .eq('farm_id', farmId!)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: farmHectares = 0 } = useQuery({
    queryKey: ['fields', farmId, 'hectares'],
    enabled: !!farmId,
    queryFn: async () => {
      const { data } = await supabase.from('fields').select('area, area_unit').eq('farm_id', farmId!);
      return (data ?? []).reduce((s, f) => s + (toHectares(Number(f.area) || 0, f.area_unit) ?? 0), 0);
    },
  });

  const inPeriod = useMemo(() => {
    if (period === 'all') return rows;
    const { startDate, endDate } = getDateRange(period);
    return rows.filter((r) => r.transaction_date >= startDate && r.transaction_date <= endDate);
  }, [rows, period]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of inPeriod) {
      const t = transactionType(r);
      if (t === 'income') income += Number(r.amount) || 0;
      if (t === 'expense') expense += Number(r.amount) || 0;
    }
    return { income, expense, net: income - expense };
  }, [inPeriod]);

  const months = useMemo(() => monthlySeries(rows, 6), [rows]);
  const spend = useMemo(() => categoryTotals(inPeriod, 'expense').slice(0, 7), [inPeriod]);
  const biggestSpend = spend[0]?.total ?? 0;

  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inPeriod.filter((r) => {
      if (kind !== 'all' && transactionType(r) !== kind) return false;
      if (q && !`${r.description ?? ''} ${r.category?.name ?? ''} ${r.payment_method ?? ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inPeriod, kind, query]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['financial_transactions'] });

  const remove = async (id: string) => {
    try {
      await deleteEntity({ id, entityType: 'transaction', onSuccess: refresh });
    } catch (e) {
      toast({ title: 'Could not delete the entry', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const exportCsv = () => {
    const csv = toCsv(
      ['Date', 'Type', 'Category', 'Description', 'Payment method', 'Reference', 'Amount'],
      listed.map((r) => [r.transaction_date, transactionType(r) ?? '', r.category?.name ?? '', r.description ?? '', r.payment_method ?? '', r.reference_number ?? '', Number(r.amount)]),
    );
    downloadCsv(`farmsync-finances-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`, csv);
  };

  const periodText = PERIOD_LABEL[period].toLowerCase();

  return (
    <div>
      <PageHeader
        title="Finances"
        description="Income and expenses for your farm, by month and by category."
        actions={
          <>
            <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
            <Button disabled={!farmId} onClick={() => setAddOpen(true)}>
              <Plus /> Add income or expense
            </Button>
          </>
        }
      />

      {!farmId || isLoading ? (
        <div className="flex justify-center p-12" role="status" aria-label="Loading finances">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 p-12 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
            <Wallet className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold">No money recorded yet</h2>
          <p className="max-w-sm text-muted-foreground">Record sales, subsidies and costs as they happen to see profit and loss by month.</p>
          <Button size="lg" className="mt-2" onClick={() => setAddOpen(true)}>
            <Plus /> Add the first entry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Segmented
            label="Period"
            value={period}
            onChange={(p) => {
              setPeriod(p);
              setShown(PAGE);
            }}
            className="self-start"
            options={(Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }))}
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            <KpiTile label="Income" value={formatMoney(totals.income)} note={periodText} />
            <KpiTile label="Expenses" value={formatMoney(totals.expense)} note={spend[0] ? `Most on ${spend[0].name.toLowerCase()}` : periodText} />
            <KpiTile label="Net" value={`${totals.net < 0 ? '−' : ''}${formatMoney(Math.abs(totals.net))}`} note={totals.net < 0 ? 'More spent than earned' : periodText} />
            <KpiTile
              label="Cost per hectare"
              value={farmHectares > 0 ? formatMoney(totals.expense / farmHectares) : '·'}
              note={farmHectares > 0 ? `${Math.round(farmHectares * 10) / 10} ha in fields` : 'Add field areas to see this'}
            />
          </div>

          <MonthlyChart months={months} />

          <div className="flex flex-wrap items-start gap-6">
            <section aria-labelledby="spend-h" className="surface flex min-w-0 flex-[1_1_300px] flex-col gap-3.5 p-5 md:p-6">
              <h2 id="spend-h" className="text-xl font-bold">
                Where money went
              </h2>
              {spend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses {periodText}.</p>
              ) : (
                spend.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1.5" title={`${c.name}: ${formatMoney(c.total)}`}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{c.name}</span>
                      <span className="font-mono">{formatMoney(c.total)}</span>
                    </div>
                    <div className="h-2 rounded bg-[#F1EEE6] dark:bg-muted" aria-hidden="true">
                      <div className="h-full rounded bg-chart-expense" style={{ width: `${(c.total / biggestSpend) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </section>

            <section aria-labelledby="entries-h" className="surface min-w-0 flex-[2_1_520px] overflow-hidden">
              <div className="flex flex-wrap items-center gap-2.5 px-5 pb-3 pt-5 md:px-6">
                <h2 id="entries-h" className="me-auto text-xl font-bold">
                  Entries
                </h2>
                <label className="flex h-10 min-w-[180px] items-center gap-2 rounded-[10px] border border-input bg-card px-2.5 text-muted-foreground focus-within:border-primary">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entries"
                    aria-label="Search entries"
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                  />
                </label>
                <Select value={kind} onValueChange={(v) => setKind(v as Kind)}>
                  <SelectTrigger className="h-10 w-[130px] text-sm" aria-label="Type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-5 md:ps-6">Date</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-end">Amount</TableHead>
                    <TableHead className="w-12 pe-5 md:pe-6">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listed.slice(0, shown).map((r) => {
                    const type = transactionType(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap ps-5 font-mono text-[13px] text-muted-foreground md:ps-6">
                          {format(parseISO(r.transaction_date), 'd MMM yyyy')}
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold">{r.description || r.category?.name || 'Entry'}</span>
                            {r.payment_method && <span className="text-[13px] capitalize text-muted-foreground">{r.payment_method.replace(/_/g, ' ')}</span>}
                          </span>
                        </TableCell>
                        <TableCell>{r.category?.name ? <Badge variant="secondary">{r.category.name}</Badge> : <span className="text-muted-foreground">·</span>}</TableCell>
                        <TableCell className={cn('whitespace-nowrap text-end font-mono', type === 'income' && 'font-medium text-[#1A5C33] dark:text-leaf')}>
                          {type === 'income' ? '+ ' : type === 'expense' ? '− ' : ''}
                          {formatMoney(Number(r.amount))}
                        </TableCell>
                        <TableCell className="pe-5 md:pe-6">
                          <DeleteButton onDelete={() => remove(r.id)} entityType="transaction" itemName={r.description || 'this entry'} buttonSize="icon" buttonVariant="ghost" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {listed.length === 0 && (
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
                  {Math.min(shown, listed.length)} of {listed.length} entries
                </span>
                {listed.length > shown && (
                  <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>
                    Show more
                  </Button>
                )}
                <span className="ms-auto flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/reports">
                      <FileText /> Reports
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCsv} disabled={listed.length === 0}>
                    <Download /> Export CSV
                  </Button>
                </span>
              </div>
            </section>
          </div>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <AddTransactionForm
          farmId={farmId}
          onSuccess={() => {
            setAddOpen(false);
            refresh();
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>
    </div>
  );
};

export default Finances;
