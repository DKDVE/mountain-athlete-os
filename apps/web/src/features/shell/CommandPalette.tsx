import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SIDEBAR_NAV } from '@/features/shell/nav-config';
import { useShellStore } from '@/features/shell/shell-store';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export function CommandPalette() {
  const open = useShellStore((s) => s.paletteOpen);
  const closePalette = useShellStore((s) => s.closePalette);
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const cycleTheme = useThemeStore((s) => s.cycle);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useShellStore.getState().openPalette();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const actions = useMemo(
    () => [
      ...SIDEBAR_NAV.map((item) => ({
        id: `nav-${item.path}`,
        label: `Go to ${item.label}`,
        run: () => navigate(item.path),
      })),
      {
        id: 'theme',
        label: 'Cycle theme (dark / light / OLED)',
        run: () => {
          cycleTheme();
        },
      },
      {
        id: 'signout',
        label: 'Sign out',
        run: async () => {
          await signOut();
          void navigate('/login');
        },
      },
    ],
    [navigate, signOut, cycleTheme],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) useShellStore.getState().openPalette();
        else closePalette();
      }}
    >
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <Command className="rounded-lg" label="Command palette">
          <Command.Input
            placeholder="Search routes and actions…"
            className="flex h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
          />
          <Command.List className="max-h-72 overflow-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>
            <Command.Group heading="Navigate">
              {actions.map((action) => (
                <Command.Item
                  key={action.id}
                  value={action.label}
                  onSelect={() => {
                    void Promise.resolve(action.run());
                    closePalette();
                  }}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm aria-selected:bg-accent"
                >
                  {action.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
