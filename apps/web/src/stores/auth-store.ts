import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { authRedirectUrl } from '@/lib/auth-redirect';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
}

async function ensureProfile(user: User) {
  await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  init: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    if (user) await ensureProfile(user);
    set({ user, loading: false, initialized: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const next = session?.user ?? null;
      if (next) await ensureProfile(next);
      set({ user: next, loading: false });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  signInWithEmail: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    return { error: error?.message ?? null };
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl() },
    });
    return { error: error?.message ?? null };
  },
  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },
}));
