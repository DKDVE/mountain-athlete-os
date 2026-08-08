import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SyncProvider } from '@/lib/sync/SyncProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRouter } from './router';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export function App() {
  const basePath = import.meta.env.VITE_APP_BASE_PATH || '/';
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={basePath === '/' ? undefined : basePath.replace(/\/$/, '')}>
          <AuthProvider>
            <SyncProvider>
              <AppRouter />
            </SyncProvider>
            <Toaster theme="dark" position="top-center" richColors />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
