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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Device = {
    id: string;
    name: string;
    type: string;
    api_key: string;
    is_active: boolean;
    farm_id: string;
};

type TelemetryData = {
    timestamp: string;
    data: any;
};

const Sensors = () => {
    const [isAddingDevice, setIsAddingDevice] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceType, setNewDeviceType] = useState('weather_station');

    // Fetch Devices
    const { data: devices, refetch: refetchDevices } = useQuery({
        queryKey: ['devices'],
        queryFn: async () => {
            const { data, error } = await supabase.from('devices').select('*');
            if (error) throw error;
            return data as Device[];
        },
    });

    // Mock Telemetry Data (Since we don't have real devices sending data yet)
    const mockData = [
        { time: '08:00', temp: 22, humidity: 60 },
        { time: '09:00', temp: 23, humidity: 58 },
        { time: '10:00', temp: 25, humidity: 55 },
        { time: '11:00', temp: 27, humidity: 52 },
        { time: '12:00', temp: 28, humidity: 50 },
        { time: '13:00', temp: 29, humidity: 48 },
    ];

    const handleAddDevice = async () => {
        try {
            // In a real app, we would select the farm properly. 
            // For now, we'll try to get the first farm or show error
            const { data: farms } = await supabase.from('farms').select('id').limit(1);

            if (!farms || farms.length === 0) {
                toast({
                    title: "Error",
                    description: "Please create a farm first using the Farms page.",
                    variant: "destructive"
                });
                return;
            }

            const apiKey = 'dev_' + Math.random().toString(36).substr(2, 9);

            const { error } = await supabase.from('devices').insert({
                name: newDeviceName,
                type: newDeviceType,
                farm_id: farms[0].id,
                api_key: apiKey
            });

            if (error) throw error;

            toast({
                title: "Device Added",
                description: `API Key: ${apiKey} (Save this, it won't be shown again!)`,
            });

            setIsAddingDevice(false);
            refetchDevices();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">loT & Sensors</h1>
                    <p className="text-muted-foreground">Manage your hardware devices and monitor real-time telemetry.</p>
                </div>
                <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Add Device
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register New Device</DialogTitle>
                        </DialogHeader>
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
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Summary Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                        <Signal className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Online and transmitting</p>
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

            {devices?.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                    <p>No devices registered yet. Click "Add Device" to get started.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Device Telemetry</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Temperature & Humidity</CardTitle>
                                <CardDescription>Real-time readings from Weather Station</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="temp" stroke="#8884d8" name="Temp (°C)" />
                                        <Line type="monotone" dataKey="humidity" stroke="#82ca9d" name="Humidity (%)" />
                                    </LineChart>
                                </ResponsiveContainer>
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
                                                            case 'irrigation_system': return <Droplets className="h-5 w-5 text-blue-500" />;
                                                            case 'livestock_tracker': return <Activity className="h-5 w-5 text-orange-500" />;
                                                            case 'equipment_tracker': return <Activity className="h-5 w-5 text-gray-600" />;
                                                            case 'storage_monitor': return <Database className="h-5 w-5 text-purple-500" />;
                                                            case 'drone': return <Wind className="h-5 w-5 text-primary" />;
                                                            case 'camera': return <Camera className="h-5 w-5 text-primary" />;
                                                            default: return <Activity className="h-5 w-5 text-primary" />;
                                                        }
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{device.name}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">{device.type.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <div className="h-2 w-2 rounded-full bg-green-600" />
                                                    Active
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 font-mono">ID: ...{device.id.substr(-4)}</p>
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
