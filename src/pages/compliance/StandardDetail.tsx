
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlayCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStandard, ComplianceRule } from '@/types/compliance';
import { runAudit, type RuleResult } from '@/lib/complianceEngine';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/common/PageHeader';

const StandardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [standard, setStandard] = useState<ComplianceStandard | null>(null);
    const [rules, setRules] = useState<ComplianceRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuditing, setIsAuditing] = useState(false);
    const [results, setResults] = useState<Record<string, RuleResult>>({});

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const { data: std } = await supabase.from('compliance_standards').select('*').eq('id', id).single();
            const { data: rls } = await supabase.from('compliance_rules').select('*').eq('standard_id', id);

            if (std) setStandard(std as ComplianceStandard);
            if (rls) setRules(rls as ComplianceRule[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Check every rule against the products recorded in the input log
    // (RLS limits this to farms the user can access).
    const handleRunAudit = async () => {
        setIsAuditing(true);
        try {
            const { data, error } = await supabase.from('sustainability_logs').select('product_name');
            if (error) throw error;

            const audit = runAudit(rules, (data || []).map((l) => l.product_name));
            setResults(Object.fromEntries(audit.map((r) => [r.ruleId, r])));

            const failed = audit.filter((r) => r.status === 'fail').length;
            const manual = audit.filter((r) => r.status === 'manual').length;
            toast({
                title: failed > 0 ? `${failed} rule${failed === 1 ? '' : 's'} failed` : "Audit complete",
                description: `${audit.length - failed - manual} passed, ${failed} failed, ${manual} need manual review.`,
                variant: failed > 0 ? "destructive" : "default",
            });
        } catch (e) {
            console.error(e);
            toast({ title: "Audit failed", description: "Could not read input logs.", variant: "destructive" });
        } finally {
            setIsAuditing(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!standard) return <div className="p-8">Standard not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard/compliance')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Compass
            </Button>

            <PageHeader
                eyebrow={[standard.version, standard.authority].filter(Boolean).join(' · ')}
                title={standard.name}
                description={standard.description}
                actions={
                    <Button onClick={handleRunAudit} size="lg" disabled={isAuditing || rules.length === 0}>
                        <PlayCircle className="h-5 w-5" />
                        {isAuditing ? 'Checking...' : 'Run compliance check'}
                    </Button>
                }
            />

            <div className="grid gap-4 mt-8">
                <h2 className="text-xl font-semibold">Rules & Criteria</h2>
                {rules.map(rule => (
                    <Card key={rule.id}>
                        <CardHeader className="py-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    {rule.category}: {rule.rule_description}
                                </CardTitle>
                                <Badge variant={rule.severity === 'critical' ? 'destructive' : 'secondary'}>
                                    {rule.severity}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-2">
                            <div className="text-xs font-mono bg-muted p-2 rounded">
                                Logic: {JSON.stringify(rule.validation_logic)}
                            </div>
                            {results[rule.id] && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Badge variant={results[rule.id].status === 'fail' ? 'destructive' : results[rule.id].status === 'pass' ? 'default' : 'outline'}>
                                        {results[rule.id].status === 'manual' ? 'Manual review' : results[rule.id].status}
                                    </Badge>
                                    <span className="text-muted-foreground">{results[rule.id].detail}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StandardDetail;
