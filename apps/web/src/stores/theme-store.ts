import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'oled';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

const STORAGE_KEY = 'maos-theme';

function readStored(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'oled' || raw === 'dark') return raw;
  return 'dark';
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle('dark', mode !== 'light');
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = readStored();
  applyTheme(initial);
  return {
    mode: initial,
    setMode: (mode) => {
      localStorage.setItem(STORAGE_KEY, mode);
      applyTheme(mode);
      set({ mode });
    },
    cycle: () => {
      const order: ThemeMode[] = ['dark', 'light', 'oled'];
      const idx = order.indexOf(get().mode);
      const next = order[(idx + 1) % order.length] ?? 'dark';
      get().setMode(next);
    },
  };
});
