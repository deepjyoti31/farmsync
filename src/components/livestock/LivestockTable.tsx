import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DeleteButton } from '@/components/common/DeleteButton';
import { ageLabel } from '@/lib/livestockRecords';

interface LivestockItem {
  id: string;
  tag_id?: string | null;
  breed?: string | null;
  gender?: string | null;
  status?: string | null;
  birth_date?: string | null;
  livestock_type?: { name?: string | null } | null;
}

interface LivestockTableProps {
  livestock: LivestockItem[];
  onDelete: (id: string) => Promise<void>;
}

const STATUS: Record<string, { variant: 'default' | 'warning' | 'secondary'; label: string }> = {
  active: { variant: 'default', label: 'On farm' },
  sold: { variant: 'warning', label: 'Sold' },
  deceased: { variant: 'secondary', label: 'Died' },
};

/** The animal register: one row per animal with tag, type, breed, sex, age and status. */
export const LivestockTable: React.FC<LivestockTableProps> = ({ livestock, onDelete }) => (
  <Table className="min-w-[640px]">
    <TableHeader>
      <TableRow>
        <TableHead className="ps-5 md:ps-6">Tag</TableHead>
        <TableHead>Animal</TableHead>
        <TableHead>Sex</TableHead>
        <TableHead>Age</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="w-12 pe-5 md:pe-6">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {livestock.map((animal) => {
        const status = STATUS[(animal.status || 'active').toLowerCase()] ?? { variant: 'secondary' as const, label: animal.status ?? '' };
        const name = animal.livestock_type?.name || 'Animal';
        return (
          <TableRow key={animal.id}>
            <TableCell className="ps-5 font-mono text-[13px] md:ps-6">{animal.tag_id ? `#${animal.tag_id}` : '·'}</TableCell>
            <TableCell>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{name}</span>
                {animal.breed && <span className="text-[13px] text-muted-foreground">{animal.breed}</span>}
              </span>
            </TableCell>
            <TableCell className="capitalize">{animal.gender && animal.gender !== 'unknown' ? animal.gender : '·'}</TableCell>
            <TableCell className="font-mono text-[13px]">{ageLabel(animal.birth_date) ?? '·'}</TableCell>
            <TableCell>
              <Badge variant={status.variant}>{status.label}</Badge>
            </TableCell>
            <TableCell className="pe-5 md:pe-6">
              <DeleteButton
                onDelete={() => onDelete(animal.id)}
                itemName={animal.tag_id ? `${name} #${animal.tag_id}` : name}
                entityType="Animal"
                buttonSize="icon"
                buttonVariant="ghost"
              />
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

export default LivestockTable;
