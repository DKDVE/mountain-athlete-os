import { render, type RenderResult } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { expect } from 'vitest';

export async function renderA11y(ui: React.ReactElement): Promise<RenderResult> {
  const result = render(ui);
  const results = await axe(result.container);
  expect(results.violations).toHaveLength(0);
  return result;
}
