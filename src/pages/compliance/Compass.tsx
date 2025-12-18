
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceStandard } from '@/types/compliance';
import { useNavigate } from 'react-router-dom';

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
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    Compass
                </h1>
                <p className="text-muted-foreground">Compliance engine & Audit readiness.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Certifications Card */}
                <Card className="col-span-1 border-green-500/20 bg-green-500/5">
                    <CardHeader>
                        <CardTitle>Active Certifications</CardTitle>
                        <CardDescription>Standards you are subscribed to</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {standards.slice(0, 1).map(std => (
                                <div key={std.id} className="flex justify-between items-center p-3 bg-background rounded-lg border">
                                    <span className="font-medium">{std.name}</span>
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                </div>
                            ))}
                            {standards.length === 0 && <p className="text-sm text-muted-foreground">No active subscriptions.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Readiness Score Card */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Audit Readiness</CardTitle>
                        <CardDescription>Based on recent log validation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-4">
                            <div className="text-5xl font-bold text-primary mb-2">92%</div>
                            <Progress value={92} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">Ready for inspection</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts Card */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Compliance Alerts</CardTitle>
                        <CardDescription>Potential violations detected</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>Buffer zone warning on Field B (2 days ago)</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>Input logs verified for Q3</span>
                            </div>
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
