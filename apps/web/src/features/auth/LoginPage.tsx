import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user) {
      void navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const onEmail = async () => {
    setError(null);
    setMessage(null);
    setPending(true);
    const result = await signInWithEmail(email.trim());
    setPending(false);
    if (result.error) setError(result.error);
    else setMessage('Check your email for the magic link.');
  };

  const onGoogle = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <p className="font-display text-2xl font-bold tracking-tight">MAOS</p>
          <CardDescription>Mountain Athlete OS — hybrid training & fuel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              autoComplete="email"
            />
          </div>
          <Button className="w-full" disabled={pending || !email.trim()} onClick={() => void onEmail()}>
            Send magic link
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void onGoogle()}>
            Continue with Google
          </Button>
          {message ? <p className="text-center text-sm text-success">{message}</p> : null}
          {error ? <p className="text-center text-sm text-destructive" role="alert">{error}</p> : null}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to train smart and log honestly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
