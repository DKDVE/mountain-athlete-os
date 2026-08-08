import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/button';
import { renderA11y } from '@/test/render-a11y';

describe('Button', () => {
  it('passes axe', async () => {
    await renderA11y(<Button>Train</Button>);
  });

  it('renders outline variant', async () => {
    const { getByRole } = await renderA11y(<Button variant="outline">Outline</Button>);
    expect(getByRole('button', { name: 'Outline' })).toBeInTheDocument();
  });
});
