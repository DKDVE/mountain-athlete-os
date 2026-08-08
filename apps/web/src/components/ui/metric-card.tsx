import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  unit,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader className="pb-2">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">
          {value}
          {unit ? <span className="ml-1 text-lg text-muted-foreground">{unit}</span> : null}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
