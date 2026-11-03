import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Leaf, Droplets, FileText, Download, Loader2 } from 'lucide-react';
import FarmSelector from '@/components/farms/FarmSelector';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { downloadBlob, downloadCsv, toCsv } from '@/lib/csv';
import { buildComplianceReport } from '@/lib/complianceReport';

const Sustainability = () => {
    const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

    // Fetch Sustainability Logs
    const { data: logs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['sustainability_logs', selectedFarmId],
        queryFn: async () => {
            if (!selectedFarmId) return [];
            // Inner join on fields so only this farm's logs are returned.
            const { data, error } = await supabase
                .from('sustainability_logs')
                .select('*, fields!inner(name, farm_id)')
                .eq('fields.farm_id', selectedFarmId)
                .order('log_date', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedFarmId
    });

    // Fetch Water Usage
    const { data: waterUsage, isLoading: isLoadingWater } = useQuery({
        queryKey: ['water_usage', selectedFarmId],
        queryFn: async () => {
            if (!selectedFarmId) return [];
            const { data, error } = await supabase
                .from('water_usage')
                .select('*, fields!inner(name, farm_id)')
                .eq('fields.farm_id', selectedFarmId)
                .order('usage_date', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!selectedFarmId
    });

    const today = format(new Date(), 'yyyy-MM-dd');

    const handleExportInputs = () => {
        if (!logs?.length) {
            toast({ title: "Nothing to export", description: "No input logs recorded for this farm yet." });
            return;
        }
        downloadCsv(`input-log-${today}.csv`, toCsv(
            ['Date', 'Field', 'Type', 'Product', 'Quantity', 'Unit', 'Method', 'Notes'],
            logs.map((l) => [l.log_date, l.fields?.name, l.type, l.product_name, l.quantity, l.unit, l.method, l.notes]),
        ));
    };

    const handleExportWater = () => {
        if (!waterUsage?.length) {
            toast({ title: "Nothing to export", description: "No water usage recorded for this farm yet." });
            return;
        }
        downloadCsv(`water-usage-${today}.csv`, toCsv(
            ['Date', 'Field', 'Volume', 'Unit', 'Source'],
            waterUsage.map((w) => [w.usage_date, w.fields?.name, w.volume, w.unit, w.source]),
        ));
    };

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Audit-ready PDF combining both logs. jsPDF is loaded only when needed.
    const handleExportPdf = async () => {
        if (!selectedFarmId) return;
        if (!logs?.length && !waterUsage?.length) {
            toast({ title: "Nothing to report", description: "Record inputs or water use for this farm first." });
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const [{ data: farm, error }, { renderComplianceReportPdf }] = await Promise.all([
                supabase.from('farms').select('name, village, district, state, total_area, area_unit').eq('id', selectedFarmId).single(),
                import('@/lib/pdf/complianceReportPdf'),
            ]);
            if (error) throw error;

            const report = buildComplianceReport(
                (logs ?? []).map((l) => ({ ...l, fieldName: l.fields?.name })),
                (waterUsage ?? []).map((w) => ({ ...w, fieldName: w.fields?.name })),
            );
            const slug = farm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'farm';
            downloadBlob(`${slug}-compliance-report-${today}.pdf`, renderComplianceReportPdf(farm, report));
        } catch (e) {
            toast({ title: "Could not create PDF", description: (e as Error).message, variant: "destructive" });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-title">Sustainability & Compliance</h1>
                    <p className="text-muted-foreground">Track farm inputs and resource usage for certification.</p>
                </div>
                <FarmSelector selectedFarmId={selectedFarmId} onFarmChange={setSelectedFarmId} />
            </div>

            {!selectedFarmId ? (
                <Card>
                    <CardContent className="flex items-center justify-center p-12">
                        <p className="text-muted-foreground">Select a farm to view logs.</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="inputs" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="inputs" className="gap-2"><Leaf className="h-4 w-4" /> Input Logs</TabsTrigger>
                        <TabsTrigger value="water" className="gap-2"><Droplets className="h-4 w-4" /> Water Usage</TabsTrigger>
                        <TabsTrigger value="reports" className="gap-2"><FileText className="h-4 w-4" /> Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inputs" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Chemical & Fertilizer Log</CardTitle>
                                    <CardDescription>Track all inputs applied to your fields.</CardDescription>
                                </div>
                                <Button>Log Input</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Method</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No input logs found.
                                                </TableCell>
                                            </TableRow>
                                        ) : logs?.map((log: any) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{format(new Date(log.log_date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{log.fields?.name}</TableCell>
                                                <TableCell className="capitalize">{log.type}</TableCell>
                                                <TableCell>{log.product_name}</TableCell>
                                                <TableCell>{log.quantity} {log.unit}</TableCell>
                                                <TableCell>{log.method}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="water" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Water Consumption</CardTitle>
                                    <CardDescription>Track irrigation volumes per field.</CardDescription>
                                </div>
                                <Button variant="outline">Log Usage</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Volume</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waterUsage?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                    No water usage records found.
                                                </TableCell>
                                            </TableRow>
                                        ) : waterUsage?.map((record: any) => (
                                            <TableRow key={record.id}>
                                                <TableCell>{format(new Date(record.usage_date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{record.fields?.name}</TableCell>
                                                <TableCell className="capitalize">{record.source}</TableCell>
                                                <TableCell>{record.volume} {record.unit}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Compliance Reports</CardTitle>
                                <CardDescription>Generate standardized reports for certification audits.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-primary/30 bg-primary/5">
                                    <div>
                                        <h3 className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Audit Report (PDF)</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Input and water summaries, full logs and a signed declaration, ready to print for an inspector.
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={handleExportPdf} disabled={isGeneratingPdf}>
                                        {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Download PDF
                                    </Button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-4 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">Organic Certification Log</h3>
                                            <p className="text-sm text-muted-foreground">Complete Input & Seed history</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleExportInputs}>
                                            <Download className="h-4 w-4 mr-2" /> Export CSV
                                        </Button>
                                    </div>
                                    <div className="p-4 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">Water Usage Report</h3>
                                            <p className="text-sm text-muted-foreground">Aggregated consumption data</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleExportWater}>
                                            <Download className="h-4 w-4 mr-2" /> Export CSV
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Sustainability;
