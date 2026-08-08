import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { MetricCard } from '@/components/ui/metric-card';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';

export function ComponentGallery() {
  const [seg, setSeg] = useState<'a' | 'b'>('a');
  const [steps, setSteps] = useState(3);
  const [toggle, setToggle] = useState(true);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-display text-2xl font-bold">Component gallery</h1>
        <p className="text-sm text-muted-foreground">Dev-only — all base UI states</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Inputs</h2>
        <Input placeholder="Email" aria-label="Demo email" />
        <NumberStepper value={steps} onChange={setSteps} label="Sets" />
        <Slider defaultValue={[50]} max={100} step={1} aria-label="Demo slider" />
        <Toggle checked={toggle} onCheckedChange={setToggle} aria-label="Demo toggle" />
        <Segmented
          options={[
            { value: 'a', label: 'Week' },
            { value: 'b', label: 'Month' },
          ]}
          value={seg}
          onChange={setSeg}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Chips</h2>
        <div className="flex gap-2">
          <Chip>Default</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="destructive">Danger</Chip>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Readiness" value="—" />
        <EmptyState className="py-6" title="No readiness" description="Bind to daily_metrics — no HRV in v1." />
        <Card>
          <CardHeader><CardTitle>Card</CardTitle></CardHeader>
          <CardContent><Skeleton className="h-8 w-full" /></CardContent>
        </Card>
      </section>

      <section>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Sets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Squat</TableCell>
              <TableCell>4</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <EmptyState title="No sessions" description="Log a workout to see history." />
      <ErrorState title="Sync failed" description="Retry when back online." action={<Button size="sm">Retry</Button>} />

      <Link to="/" className="text-sm text-muted-foreground underline">Back to Today</Link>
    </div>
  );
}
