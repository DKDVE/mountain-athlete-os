import { WifiOff } from 'lucide-react';
import { useConnectivityStore } from '@/stores/connectivity-store';

export function OfflineBanner() {
  const online = useConnectivityStore((s) => s.online);
  const outboxCount = useConnectivityStore((s) => s.outboxCount);

  if (online && outboxCount === 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning"
      role="status"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!online ? (
        <span>Offline — changes will sync when reconnected</span>
      ) : (
        <span>{outboxCount} item(s) waiting to sync</span>
      )}
    </div>
  );
}
