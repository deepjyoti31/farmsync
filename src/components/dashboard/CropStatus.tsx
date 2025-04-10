
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crop } from '@/types';

interface CropStatusProps {
  crops: Crop[];
}

const CropStatus: React.FC<CropStatusProps> = ({ crops }) => {
  const getStatusCount = (status: string) => {
    return crops.filter(crop => crop.status === status).length;
  };

  const totalCrops = crops.length;
  const plannedCount = getStatusCount('planned');
  const plantedCount = getStatusCount('planted');
  const growingCount = getStatusCount('growing');
  const harvestedCount = getStatusCount('harvested');

  const getStatusPercentage = (count: number) => {
    return Math.round((count / totalCrops) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Crop Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Planned</span>
            <span>{plannedCount} crops</span>
          </div>
          <Progress value={getStatusPercentage(plannedCount)} className="h-2 bg-muted" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Planted</span>
            <span>{plantedCount} crops</span>
          </div>
          <Progress value={getStatusPercentage(plantedCount)} className="h-2 bg-muted" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Growing</span>
            <span>{growingCount} crops</span>
          </div>
          <Progress value={getStatusPercentage(growingCount)} className="h-2 bg-muted" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Harvested</span>
            <span>{harvestedCount} crops</span>
          </div>
          <Progress value={getStatusPercentage(harvestedCount)} className="h-2 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
};

export default CropStatus;
