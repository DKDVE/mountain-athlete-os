import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the MAOS heading', () => {
    render(<LandingPage />);
    expect(screen.getByRole('heading', { name: /MAOS — online/i })).toBeInTheDocument();
  });
});
