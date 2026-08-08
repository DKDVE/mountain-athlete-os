import { useLocation } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SIDEBAR_NAV } from '@/features/shell/nav-config';
import { useAuthStore } from '@/stores/auth-store';
import { useShellStore } from '@/features/shell/shell-store';

export function TopBar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const openPalette = useShellStore((s) => s.openPalette);

  const title =
    SIDEBAR_NAV.find((n) =>
      n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path),
    )?.label ?? 'MAOS';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <h1 className="font-display text-lg font-semibold md:hidden">MAOS</h1>
      <h1 className="hidden font-display text-lg font-semibold md:block">{title}</h1>
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 md:flex"
        onClick={openPalette}
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="text-muted-foreground">Search</span>
        <kbd className="font-mono text-xs text-muted-foreground">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Account">
        <User className="h-5 w-5" />
        <span className="sr-only">{user?.email ?? 'Account'}</span>
      </Button>
    </header>
  );
}
