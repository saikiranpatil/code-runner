import { cn } from '@/lib/utils';
import React from 'react';

export interface SpinnerProps extends React.ComponentPropsWithoutRef<'span'> {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  overlayClassName?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
} as const;

export const Spinner = ({
  size = 'md',
  fullScreen = false,
  className,
  overlayClassName,
  ...props
}: SpinnerProps) => {
  const spinnerElement = (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]',
        sizeMap[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </span>
  );

  if (fullScreen) {
    return (
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
          overlayClassName
        )}
      >
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

Spinner.displayName = 'Spinner';