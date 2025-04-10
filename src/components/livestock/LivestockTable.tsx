
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteButton } from '@/components/common/DeleteButton';

interface LivestockItem {
  id: string;
  tag_id?: string;
  breed?: string;
  gender?: string;
  status?: string;
  livestock_type?: {
    name?: string;
  };
}

interface LivestockTableProps {
  livestock: LivestockItem[];
  onDelete: (id: string) => Promise<void>;
}

export const LivestockTable: React.FC<LivestockTableProps> = ({ livestock, onDelete }) => {
  const getHealthBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-farm-green text-white">Active</Badge>;
      case 'sold':
        return <Badge className="bg-farm-yellow text-black">Sold</Badge>;
      case 'deceased':
        return <Badge className="bg-destructive">Deceased</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Breed</TableHead>
          <TableHead>Tag ID</TableHead>
          <TableHead>Gender</TableHead>
          <TableHead>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 mr-1" />
              <span>Status</span>
            </div>
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {livestock.map((animal) => (
          <TableRow key={animal.id}>
            <TableCell className="font-medium">{animal.livestock_type?.name || 'Unknown'}</TableCell>
            <TableCell>{animal.breed || '-'}</TableCell>
            <TableCell>{animal.tag_id || '-'}</TableCell>
            <TableCell className="capitalize">{animal.gender || 'Unknown'}</TableCell>
            <TableCell>
              {getHealthBadge(animal.status || 'active')}
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">Details</Button>
                <DeleteButton 
                  onDelete={() => onDelete(animal.id)}
                  itemName={animal.tag_id || animal.livestock_type?.name}
                  entityType="Livestock"
                  buttonSize="sm"
                  buttonVariant="ghost"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default LivestockTable;
