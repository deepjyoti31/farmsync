import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Activity, Thermometer, Droplets, Wind, Signal, Database, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AXIS_PROPS, GRID_PROPS, categoryColor, TOOLTIP_PROPS } from '@/lib/chartPalette';
import { generateDeviceApiKey, metricLabel, toTelemetrySeries } from '@/lib/telemetry';
import PageHeader from '@/components/common/PageHeader';
import FarmSelector from '@/components/farms/FarmSelector';


type Device = {
    id: string;
    name: string;
    type: string;
    is_active: boolean;
    farm_id: string;
};

const Sensors = () => {
    const [farmId, setFarmId] = useState<string | null>(null);
    const [isAddingDevice, setIsAddingDevice] = useState(false);
    // Shown once in the dialog after registering; a toast disappears before it can be copied.
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('weather_station');

    // Fetch Devices
    const { data: devices, refetch: refetchDevices } = useQuery({
        queryKey: ['devices', farmId],
        enabled: !!farmId,
        queryFn: async () => {
            // Never the api_key: it is shown once at registration and is not readable afterwards.
            const { data, error } = await supabase.from('devices').select('id, name, type, is_active, farm_id').eq('farm_id', farmId!).order('name');
            if (error) throw error;
            return data as Device[];
        },
    });

    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const activeDeviceId = (selectedDeviceId && devices?.some((d) => d.id === selectedDeviceId) ? selectedDeviceId : null) ?? devices?.[0]?.id ?? null;
    const activeDevice = devices?.find((d) => d.id === activeDeviceId);

    // Latest readings for the selected device, refreshed every minute
    const { data: telemetry, isLoading: isLoadingTelemetry } = useQuery({
        queryKey: ['telemetry', activeDeviceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('telemetry')
                .select('timestamp, data')
                .eq('device_id', activeDeviceId!)
                .order('timestamp', { ascending: false })
                .limit(50);
            if (error) throw error;
            return toTelemetrySeries(data || []);
        },
        enabled: !!activeDeviceId,
        refetchInterval: 60_000,
    });

    const handleAddDevice = async () => {
        const name = newDeviceName.trim();
        if (!farmId) return;
        if (!name) {
            toast({ title: "Name the device", description: "Give it a name you will recognise, e.g. North Field Station.", variant: "destructive" });
            return;
        }
        try {
            const apiKey = generateDeviceApiKey();

            const { error } = await supabase.from('devices').insert({
                name,
                type: newDeviceType,
                farm_id: farmId,
                api_key: apiKey
            });

            if (error) throw error;

            setCreatedKey(apiKey);
            setNewDeviceName('');
            setNewDeviceType('weather_station');
            refetchDevices();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const closeAddDialog = (open: boolean) => {
        setIsAddingDevice(open);
        if (!open) setCreatedKey(null);
    };

    return (
        <div className="space-y-6">
            <PageHeader
              title="Sensors"
              description="Manage your hardware devices and monitor real-time telemetry."
              actions={
                <>
                  <FarmSelector selectedFarmId={farmId} onFarmChange={setFarmId} />
                  <Dialog open={isAddingDevice} onOpenChange={closeAddDialog}>
                      <DialogTrigger asChild>
                          <Button className="gap-2" disabled={!farmId}>
                              <Plus className="h-4 w-4" /> Add Device
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Register New Device</DialogTitle>
                          </DialogHeader>
                          {createdKey ? (
                              <div className="space-y-3 py-4">
                                  <p className="text-sm">Device registered. Copy its API key now and put it in the device's settings; it is sent in the <code className="font-mono">x-device-api-key</code> header.</p>
                                  <Input readOnly value={createdKey} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Device API key" />
                                  <DialogFooter>
                                      <Button variant="outline" onClick={() => navigator.clipboard?.writeText(createdKey).then(() => toast({ title: 'API key copied' }))}>Copy key</Button>
                                      <Button onClick={() => closeAddDialog(false)}>Done</Button>
                                  </DialogFooter>
                              </div>
                          ) : (
                          <>
                          <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                  <Label>Device Name</Label>
                                  <Input
                                      value={newDeviceName}
                                      onChange={(e) => setNewDeviceName(e.target.value)}
                                      placeholder="e.g. North Field Station"
                                  />
                              </div>
                              <div className="grid gap-2">
                                  <Label>Device Type</Label>
                                  <Select value={newDeviceType} onValueChange={setNewDeviceType}>
                                      <SelectTrigger>
                                          <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="weather_station">Weather Station</SelectItem>
                                          <SelectItem value="soil_sensor">Soil Sensor</SelectItem>
                                          <SelectItem value="irrigation_system">Irrigation System</SelectItem>
                                          <SelectItem value="livestock_tracker">Livestock Tracker</SelectItem>
                                          <SelectItem value="equipment_tracker">Equipment Tracker</SelectItem>
                                          <SelectItem value="storage_monitor">Silo/Storage Monitor</SelectItem>
                                          <SelectItem value="drone">Drone</SelectItem>
                                          <SelectItem value="camera">Camera/Vision</SelectItem>
                                          <SelectItem value="generic">Generic/Other</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <DialogFooter>
                              <Button onClick={handleAddDevice}>Register Device</Button>
                          </DialogFooter>
                          </>
                          )}
                      </DialogContent>
                  </Dialog>
                </>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Summary Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                        <Signal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices?.filter((d) => d.is_active).length || 0}</div>
                        <p className="text-xs text-muted-foreground">of {devices?.length || 0} registered</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alerts</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Active warnings</p>
                    </CardContent>
                </Card>
            </div>

            {!farmId ? null : devices?.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                    <p>No devices registered yet. Click "Add Device" to get started.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Device Telemetry</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="col-span-1">
                            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                                <div>
                                    <CardTitle>Live Readings</CardTitle>
                                    <CardDescription>Last 50 readings from {activeDevice?.name ?? 'device'}</CardDescription>
                                </div>
                                <Select value={activeDeviceId ?? undefined} onValueChange={setSelectedDeviceId}>
                                    <SelectTrigger className="w-[180px]" aria-label="Device">
                                        <SelectValue placeholder="Select device" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {devices?.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {isLoadingTelemetry ? (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">Loading readings...</div>
                                ) : !telemetry || telemetry.metrics.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                                        <Signal className="h-8 w-8 opacity-50" />
                                        <p className="font-medium text-foreground">No readings received yet</p>
                                        <p>
                                            Send JSON to the <code className="font-mono">ingest-telemetry</code> function with
                                            the device API key in the <code className="font-mono">x-device-api-key</code> header.
                                        </p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={telemetry.points}>
                                            <CartesianGrid {...GRID_PROPS} />
                                            <XAxis {...AXIS_PROPS} dataKey="time" />
                                            <YAxis {...AXIS_PROPS} />
                                            <Tooltip {...TOOLTIP_PROPS} />
                                            <Legend />
                                            {telemetry.metrics.map((metric, i) => (
                                                <Line
                                                    key={metric}
                                                    type="monotone"
                                                    dataKey={metric}
                                                    stroke={categoryColor(i)}
                                                    name={metricLabel(metric)}
                                                    dot={false}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Device List */}
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Registered Devices</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {devices?.map((device) => (
                                        <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    {(() => {
                                                        switch (device.type) {
                                                            case 'weather_station': return <Thermometer className="h-5 w-5 text-primary" />;
                                                            case 'soil_sensor': return <Droplets className="h-5 w-5 text-primary" />;
                                                            case 'irrigation_system': return <Droplets className="h-5 w-5 text-info" />;
                                                            case 'livestock_tracker': return <Activity className="h-5 w-5 text-[#B26B00]" />;
                                                            case 'equipment_tracker': return <Activity className="h-5 w-5 text-muted-foreground" />;
                                                            case 'storage_monitor': return <Database className="h-5 w-5 text-info" />;
                                                            case 'drone': return <Wind className="h-5 w-5 text-primary" />;
                                                            case 'camera': return <Camera className="h-5 w-5 text-primary" />;
                                                            default: return <Activity className="h-5 w-5 text-primary" />;
                                                        }
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{device.name}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{device.type.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`flex items-center gap-2 text-sm ${device.is_active ? 'text-leaf' : 'text-muted-foreground'}`}>
                                                    <div className={`h-2 w-2 rounded-full ${device.is_active ? 'bg-leaf' : 'bg-muted-foreground'}`} />
                                                    {device.is_active ? 'Active' : 'Inactive'}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 font-mono">ID: ...{device.id.slice(-4)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sensors;
