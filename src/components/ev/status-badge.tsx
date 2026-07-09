'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  operational: {
    label: 'Operational',
    className: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  under_maintenance: {
    label: 'Under Maintenance',
    className: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  temporarily_unavailable: {
    label: 'Temporarily Unavailable',
    className: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  power_failure: {
    label: 'Power Failure',
    className: 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400',
  },
  communication_failure: {
    label: 'Communication Failure',
    className: 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400',
  },
  permanently_closed: {
    label: 'Permanently Closed',
    className: 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400',
  },
};

const DEFAULT_CONFIG = {
  label: 'Unknown',
  className: 'border-transparent bg-muted text-muted-foreground',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}