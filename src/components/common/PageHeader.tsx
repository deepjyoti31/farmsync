import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  /** Small mono label above the title, e.g. the date */
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons, selectors or a segmented control, aligned to the right on wide screens */
  actions?: React.ReactNode;
  className?: string;
}

/** The title block at the top of every app screen. */
const PageHeader = ({ title, eyebrow, description, actions, className }: PageHeaderProps) => (
  <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="flex min-w-0 flex-col gap-1.5">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="page-title">{title}</h1>
      {description && <p className="text-base text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
