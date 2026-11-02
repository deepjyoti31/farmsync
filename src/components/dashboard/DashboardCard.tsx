import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  /** Short context next to the title, e.g. "4 open" */
  meta?: React.ReactNode;
  /** "All tasks →" style link in the header */
  link?: { to: string; label: string };
  children: React.ReactNode;
  className?: string;
  /** Remove the body padding, for lists that run edge to edge */
  flush?: boolean;
}

/** Card used across the Today screen: flat surface, display title, optional link. */
const DashboardCard = ({ title, meta, link, children, className, flush }: DashboardCardProps) => {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className={cn('surface overflow-hidden', className)}>
      <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 pt-4 md:px-6', flush ? 'border-b border-muted pb-3.5' : 'pb-1')}>
        <h2 id={id} className="text-xl font-bold">
          {title}
        </h2>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
        {link && (
          <Link to={link.to} className="ms-auto py-1 text-sm font-semibold text-primary hover:text-foreground">
            {link.label} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      <div className={cn(!flush && 'px-5 pb-5 md:px-6')}>{children}</div>
    </section>
  );
};

export default DashboardCard;
