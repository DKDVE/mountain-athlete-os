import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore, type ThemeMode } from '@/stores/theme-store';
import { useShellStore } from '@/features/shell/shell-store';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'oled', label: 'OLED' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const openHelp = useShellStore((s) => s.openHelp);

  const onSignOut = async () => {
    await signOut();
    void navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">{user?.email ?? 'Signed in'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <Segmented options={THEME_OPTIONS} value={mode} onChange={setMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Press <kbd className="rounded border px-1 font-mono text-xs">⌘K</kbd> for the command
            palette or <kbd className="rounded border px-1 font-mono text-xs">?</kbd> for shortcuts.
          </p>
          <Button variant="outline" onClick={openHelp}>View shortcuts</Button>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => void onSignOut()}>
        Sign out
      </Button>
    </div>
  );
}
