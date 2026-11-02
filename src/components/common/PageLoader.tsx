import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  /** Fill the whole viewport instead of the content area. */
  fullScreen?: boolean;
}

/** Spinner shown while a lazily loaded page is being fetched. */
const PageLoader: React.FC<PageLoaderProps> = ({ fullScreen = false }) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      'flex w-full items-center justify-center',
      fullScreen ? 'h-screen' : 'h-64',
    )}
  >
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="sr-only">Loading</span>
  </div>
);

export default PageLoader;
