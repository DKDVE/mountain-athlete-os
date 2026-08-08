import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { flushOutbox } from '@/lib/sync/flush';
import { refreshOutboxCount } from '@/lib/sync/outbox';
import { bindConnectivityListeners, useConnectivityStore } from '@/stores/connectivity-store';
import { useAuthStore } from '@/stores/auth-store';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id);
  const online = useConnectivityStore((s) => s.online);

  useEffect(() => {
    const unbind = bindConnectivityListeners();
    refreshOutboxCount().catch(() => undefined);
    return unbind;
  }, []);

  useEffect(() => {
    if (!userId || !online) return;
    void flushOutbox(supabase, userId);
  }, [userId, online]);

  return children;
}
