
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Ruler, Sprout, LandPlot, Wheat } from 'lucide-react';
import { Field } from '@/types';

interface FieldCardProps {
  field: Field;
  onEdit?: (field: Field) => void;
  onDelete?: (fieldId: string) => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, onEdit, onDelete }) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="p-4 pb-0 flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-md">
            <LandPlot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{field.name}</h3>
            <p className="text-xs text-muted-foreground">
              {field.farm_name || 'No farm specified'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              className="text-muted-foreground hover:text-foreground p-1 rounded-sm transition-colors"
              onClick={() => onEdit(field)}
              title="Edit field"
            >
              <span className="sr-only">Edit</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.33168 11.3754 6.42164 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42161 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42161 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className="text-destructive/70 hover:text-destructive p-1 rounded-sm transition-colors"
              onClick={() => onDelete(field.id)}
              title="Delete field"
            >
              <span className="sr-only">Delete</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3.5 5C3.22386 5 3 5.22386 3 5.5C3 5.77614 3.22386 6 3.5 6H4V12C4 12.5523 4.44772 13 5 13H10C10.5523 13 11 12.5523 11 12V6H11.5C11.7761 6 12 5.77614 12 5.5C12 5.22386 11.7761 5 11.5 5H3.5ZM5 6H10V12H5V6Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3 flex-grow">
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Area</span>
            </div>
            <p className="text-sm pl-6">
              {field.area} {field.areaUnit}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Wheat className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Soil</span>
            </div>
            <p className="text-sm pl-6">
              {field.soilType || 'Unknown'}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground">
                <path d="M9.85355 1.14645C10.0488 1.34171 10.0488 1.65829 9.85355 1.85355L3.85355 7.85355C3.65829 8.04881 3.34171 8.04881 3.14645 7.85355C2.95118 7.65829 2.95118 7.34171 3.14645 7.14645L9.14645 1.14645C9.34171 0.951184 9.65829 0.951184 9.85355 1.14645ZM7.85355 3.14645C8.04881 3.34171 8.04881 3.65829 7.85355 3.85355L3.85355 7.85355C3.65829 8.04881 3.34171 8.04881 3.14645 7.85355C2.95118 7.65829 2.95118 7.34171 3.14645 7.14645L7.14645 3.14645C7.34171 2.95118 7.65829 2.95118 7.85355 3.14645ZM11.8536 3.14645C12.0488 3.34171 12.0488 3.65829 11.8536 3.85355L3.85355 11.8536C3.65829 12.0488 3.34171 12.0488 3.14645 11.8536C2.95118 11.6583 2.95118 11.3417 3.14645 11.1464L11.1464 3.14645C11.3417 2.95118 11.6583 2.95118 11.8536 3.14645ZM7.85355 7.14645C8.04881 7.34171 8.04881 7.65829 7.85355 7.85355L3.85355 11.8536C3.65829 12.0488 3.34171 12.0488 3.14645 11.8536C2.95118 11.6583 2.95118 11.3417 3.14645 11.1464L7.14645 7.14645C7.34171 6.95118 7.65829 6.95118 7.85355 7.14645ZM11.8536 7.14645C12.0488 7.34171 12.0488 7.65829 11.8536 7.85355L7.85355 11.8536C7.65829 12.0488 7.34171 12.0488 7.14645 11.8536C6.95118 11.6583 6.95118 11.3417 7.14645 11.1464L11.1464 7.14645C11.3417 6.95118 11.6583 6.95118 11.8536 7.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              <span className="text-sm font-medium">pH Level</span>
            </div>
            <p className="text-sm pl-6">
              {field.soilPH || 'N/A'}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Crops</span>
            </div>
            <p className="text-sm pl-6">
              {field.crops && field.crops.length > 0 ? field.crops.length : 'None'}
            </p>
          </div>
        </div>
      </CardContent>


    </Card>
  );
};

export default FieldCard;
