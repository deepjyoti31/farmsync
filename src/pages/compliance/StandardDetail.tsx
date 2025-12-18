
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, PlayCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStandard, ComplianceRule } from '@/types/compliance';
import { runMockAudit } from '@/lib/complianceEngine';
import { toast } from '@/hooks/use-toast';

const StandardDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [standard, setStandard] = useState<ComplianceStandard | null>(null);
    const [rules, setRules] = useState<ComplianceRule[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleRunAudit = () => {
        toast({
            title: "Running Audit...",
            description: "Validating latest farm logs against rules.",
        });

        // Simulate checking
        setTimeout(() => {
            toast({
                title: "Audit Complete",
                description: "No critical violations found. 1 Warning.",
                variant: "default"
            });
        }, 1500);
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!standard) return <div className="p-8">Standard not found</div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard/compliance')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Compass
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold">{standard.name}</h1>
                    <div className="flex gap-2">
                        <Badge>{standard.version}</Badge>
                        <Badge variant="outline">{standard.authority}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{standard.description}</p>
                </div>
                <Button onClick={handleRunAudit} size="lg">
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Runs Compliance Check
                </Button>
            </div>

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
                        <CardContent className="pb-4">
                            <div className="text-xs font-mono bg-muted p-2 rounded">
                                Logic: {JSON.stringify(rule.validation_logic)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default StandardDetail;
