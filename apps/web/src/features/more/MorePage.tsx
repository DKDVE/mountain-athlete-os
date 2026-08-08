import { Link, useNavigate } from 'react-router-dom';
import { Activity, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useShellStore } from '@/features/shell/shell-store';

const MORE_LINKS = [
  { path: '/body', label: 'Body', icon: Activity },
  { path: '/coach', label: 'Coach', icon: MessageSquare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function MorePage() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const cycleTheme = useThemeStore((s) => s.cycle);
  const openPalette = useShellStore((s) => s.openPalette);
  const openHelp = useShellStore((s) => s.openHelp);

  const onSignOut = async () => {
    await signOut();
    void navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 md:pb-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">More</h2>
        <p className="text-sm text-muted-foreground">Navigation and account controls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Navigate</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {MORE_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openPalette}>Command palette</Button>
          <Button variant="outline" onClick={openHelp}>Keyboard shortcuts</Button>
          <Button variant="outline" onClick={cycleTheme}>Cycle theme</Button>
        </CardContent>
      </Card>

      {import.meta.env.DEV ? (
        <Card>
          <CardHeader>
            <CardTitle>Developer</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/dev/components"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Component gallery
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Button variant="outline" className="w-full" onClick={() => void onSignOut()}>
        Sign out
      </Button>
    </div>
  );
}
