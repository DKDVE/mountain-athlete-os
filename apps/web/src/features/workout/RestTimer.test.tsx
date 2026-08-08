import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { RestTimer } from '@/features/workout/RestTimer';

describe('RestTimer a11y', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollY', 0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes axe', async () => {
    const endsAt = Date.now() + 60_000;
    const { container } = render(
      <RestTimer endsAt={endsAt} onSkip={() => undefined} onAdjust={() => undefined} />,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
