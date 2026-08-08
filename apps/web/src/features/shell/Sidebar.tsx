import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SIDEBAR_NAV } from '@/features/shell/nav-config';
import { cn } from '@/lib/utils';

function defaultCollapsed(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(max-width: 1199px)').matches;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1199px)');
    const onChange = () => {
      if (mq.matches) {
        setCollapsed(true);
      }
    };
    mq.addEventListener('change', onChange);
    return () => {
      mq.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <aside
      className={cn(
        'hidden shrink-0 border-r border-border bg-card transition-[width] duration-200 md:flex md:flex-col',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed ? <span className="font-display text-sm font-bold tracking-tight">MAOS</span> : null}
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          onClick={() => {
            setCollapsed((c) => !c);
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {SIDEBAR_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
