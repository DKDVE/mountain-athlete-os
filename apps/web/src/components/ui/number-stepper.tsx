import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
}) {
  const dec = () => {
    onChange(Math.max(min, value - step));
  };
  const inc = () => {
    onChange(Math.min(max, value + step));
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
      <Button type="button" variant="outline" size="icon" onClick={dec} aria-label="Decrease">
        <Minus className="h-4 w-4" />
      </Button>
      <span className="font-display min-w-[3ch] text-center text-lg tabular-nums">{value}</span>
      <Button type="button" variant="outline" size="icon" onClick={inc} aria-label="Increase">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
