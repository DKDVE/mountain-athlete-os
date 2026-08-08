import { create } from 'zustand';

interface ShellState {
  paletteOpen: boolean;
  helpOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  openHelp: () => void;
  closeHelp: () => void;
}

export const useShellStore = create<ShellState>((set) => ({
  paletteOpen: false,
  helpOpen: false,
  openPalette: () => {
    set({ paletteOpen: true });
  },
  closePalette: () => {
    set({ paletteOpen: false });
  },
  openHelp: () => {
    set({ helpOpen: true });
  },
  closeHelp: () => {
    set({ helpOpen: false });
  },
}));
