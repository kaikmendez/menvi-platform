import type { HTMLAttributes } from 'react';
import { cn } from '../lib';

export function TableWrapper({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('overflow-x-auto rounded-lg border border-zinc-200', className)} {...props} />;
}
