import type { InputHTMLAttributes } from 'react';
import { cn } from '../lib';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-zinc-300 focus:ring-2',
        className
      )}
      {...props}
    />
  );
}
