import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useOnboardingComplete } from '@/features/onboarding/onboarding-queries';

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { complete, isLoading } = useOnboardingComplete();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
