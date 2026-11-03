import { cn } from '@/lib/utils';

/** The FarmSync mark: a sprout on a harvest-amber tile. */
const BrandMark = ({ className, withName = true, nameClassName }: { className?: string; withName?: boolean; nameClassName?: string }) => (
  <span className={cn('inline-flex items-center gap-2.5', className)}>
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#E9A23B" />
      <path
        d="M16 25v-9M16 16c0-5 3.5-8.5 9-8.5 0 5-3.5 8.5-9 8.5zM16 19c0-3.6-2.8-6-7.5-6 0 3.6 2.8 6 7.5 6z"
        fill="none"
        stroke="#11261A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {withName && <span className={cn('font-display text-xl font-bold tracking-tight', nameClassName)}>FarmSync</span>}
  </span>
);

export default BrandMark;
