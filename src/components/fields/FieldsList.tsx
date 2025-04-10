
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Field } from '@/types';
import FieldCard from './FieldCard';

interface FieldsListProps {
  fields: Field[];
}

const FieldsList: React.FC<FieldsListProps> = ({ fields }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Fields</h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Field
        </Button>
      </div>
      
      {fields.length === 0 ? (
        <div className="bg-muted/40 border rounded-lg p-12 text-center">
          <h3 className="text-xl font-medium mb-2">No Fields Added Yet</h3>
          <p className="text-muted-foreground mb-6">
            Add your first field to start managing your farm efficiently.
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Field
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldsList;
