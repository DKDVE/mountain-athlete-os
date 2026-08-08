import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOBILE_TABS } from '@/features/shell/nav-config';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-end border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      {MOBILE_TABS.slice(0, 2).map((item) => (
        <TabLink key={item.path} item={item} />
      ))}
      <div className="flex flex-1 items-center justify-center pb-2">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Quick log"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      {MOBILE_TABS.slice(2).map((item) => (
        <TabLink key={item.path} item={item} />
      ))}
    </nav>
  );
}

function TabLink({
  item,
}: {
  item: { path: string; label: string; icon: React.ComponentType<{ className?: string }> };
}) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )
      }
    >
      <item.icon className="h-5 w-5" aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  );
}
