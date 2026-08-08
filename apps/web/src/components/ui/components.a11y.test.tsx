import { describe, it } from 'vitest';
import { MetricCard } from '@/components/ui/metric-card';
import { RingProgress } from '@/components/ui/ring-progress';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { renderA11y } from '@/test/render-a11y';

describe('base UI a11y', () => {
  it('MetricCard', async () => {
    await renderA11y(<MetricCard label="Readiness" value={82} />);
  });

  it('RingProgress', async () => {
    await renderA11y(<RingProgress value={72} label="Ready" />);
  });

  it('Chip', async () => {
    await renderA11y(<Chip variant="success">On track</Chip>);
  });

  it('EmptyState', async () => {
    await renderA11y(<EmptyState title="No data" description="Log something." />);
  });

  it('ErrorState', async () => {
    await renderA11y(<ErrorState title="Failed" description="Try again." />);
  });

  it('Input', async () => {
    await renderA11y(<Input aria-label="Email" placeholder="you@example.com" />);
  });
});
