
import React from 'react';
import FieldsList from '@/components/fields/FieldsList';
import { fields } from '@/data/mockData';

const Fields = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Field Management</h1>
      <p className="text-muted-foreground">
        Manage all your fields, track soil health, and plan your crops efficiently.
      </p>
      
      <FieldsList fields={fields} />
    </div>
  );
};

export default Fields;
