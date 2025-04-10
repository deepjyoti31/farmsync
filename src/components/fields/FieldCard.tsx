
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Ruler, Sprout } from 'lucide-react';
import { Field } from '@/types';

interface FieldCardProps {
  field: Field;
}

const FieldCard: React.FC<FieldCardProps> = ({ field }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-40 bg-muted flex items-center justify-center">
        {field.images && field.images.length > 0 ? (
          <img 
            src={field.images[0]} 
            alt={field.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <MapPin className="h-16 w-16 text-muted-foreground/40" />
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{field.name}</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{field.location || 'No location specified'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span>
              {field.area} {field.areaUnit}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-muted-foreground" />
            <span>{field.crops && field.crops.length > 0 ? `${field.crops.length} crops planted` : 'No crops planted'}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-muted/50">
          {field.soilType || 'Unknown soil type'}
        </Badge>
        <Badge variant="outline" className="bg-muted/50">
          pH {field.soilPH || 'N/A'}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default FieldCard;
