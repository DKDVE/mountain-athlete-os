import { create } from 'zustand';

interface ConnectivityState {
  online: boolean;
  outboxCount: number;
  setOnline: (online: boolean) => void;
  setOutboxCount: (count: number) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  outboxCount: 0,
  setOnline: (online) => {
    set({ online });
  },
  setOutboxCount: (outboxCount) => {
    set({ outboxCount });
  },
}));

export function bindConnectivityListeners() {
  const setOnline = useConnectivityStore.getState().setOnline;
  const onOnline = () => {
    setOnline(true);
  };
  const onOffline = () => {
    setOnline(false);
  };
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  setOnline(navigator.onLine);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
