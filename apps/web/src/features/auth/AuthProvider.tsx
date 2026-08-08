import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { bindConnectivityListeners } from '@/stores/connectivity-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    void init();
    return bindConnectivityListeners();
  }, [init]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return children;
}
