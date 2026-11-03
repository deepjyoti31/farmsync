
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStandard } from '@/types/compliance';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';

const Compass = () => {
    const [standards, setStandards] = useState<ComplianceStandard[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStandards();
    }, []);

    const loadStandards = async () => {
        try {
            const { data } = await supabase.from('compliance_standards').select('*');
            if (data) setStandards(data as ComplianceStandard[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
              eyebrow="Compass"
              title="Compliance"
              description="Compliance engine & Audit readiness."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Certifications Card */}
                <Card className="col-span-1 border-leaf/25 bg-leaf-tint/60">
                    <CardHeader>
                        <CardTitle>Active Certifications</CardTitle>
                        <CardDescription>Standards you are subscribed to</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {standards.slice(0, 1).map(std => (
                                <div key={std.id} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                                    <span className="font-medium">{std.name}</span>
                                    <Badge variant="outline" className="text-leaf border-leaf/30 bg-leaf-tint">Active</Badge>
                                </div>
                            ))}
                            {standards.length === 0 && <p className="text-sm text-muted-foreground">No active subscriptions.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* How readiness is measured: no score is shown until a check has actually been run */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Check your readiness</CardTitle>
                        <CardDescription>Compass checks your input and water logs against a standard's rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <p className="text-muted-foreground">
                            Open a standard below and run a compliance check to see which rules pass and which fail. For an inspector, export the audit-ready PDF from the Sustainability page.
                        </p>
                        <div className="flex items-start gap-2 rounded-[10px] bg-info-tint p-3 text-[#173E6B] dark:text-info">
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>The check compares the products in your input logs with each standard's banned list, so keep those logs up to date.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-semibold mt-8">Available Standards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? <div>Loading...</div> : standards.map(std => (
                    <Card key={std.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/compliance/${std.id}`)}>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                {std.name}
                                <Badge variant="secondary">{std.version}</Badge>
                            </CardTitle>
                            <CardDescription>{std.authority}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">{std.description}</p>
                            <Button variant="ghost" className="mt-4 p-0 h-auto font-semibold text-primary">View Rules &rarr;</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Compass;
