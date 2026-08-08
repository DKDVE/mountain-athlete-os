import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ErrorState({
  title = 'Something went wrong',
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
