import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceFarms } from '@/hooks/useWorkspaceFarms';

/**
 * What a farm page shows while no farm is selected: a spinner until the farm
 * picker has chosen one, or, when the workspace has no farms at all, a way to
 * add the first. Without this the page would show its spinner for ever.
 */
const NoFarmState = () => {
  const { farms, isPending, error } = useWorkspaceFarms();

  if (!error && (isPending || farms.length > 0)) {
    return (
      <div className="flex justify-center p-12" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="surface flex flex-col items-center gap-3 p-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-leaf-tint text-primary">
        <MapPin className="h-8 w-8" aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold">{error ? 'Could not load your farms' : 'No farms in this workspace yet'}</h2>
      <p className="max-w-sm text-muted-foreground">
        {error ? 'Check your connection and open the page again.' : 'Add a farm to this workspace, or switch workspace in the sidebar to see your other farms.'}
      </p>
      {!error && (
        <Button size="lg" className="mt-2" asChild>
          <Link to="/dashboard/farms">Add a farm</Link>
        </Button>
      )}
    </div>
  );
};

export default NoFarmState;
