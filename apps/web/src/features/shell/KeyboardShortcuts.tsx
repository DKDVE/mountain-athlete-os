import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SIDEBAR_NAV } from '@/features/shell/nav-config';
import { useShellStore } from '@/features/shell/shell-store';

export function KeyboardShortcuts() {
  const navigate = useNavigate();
  const gPending = useRef(false);
  const openHelp = useShellStore((s) => s.openHelp);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        openHelp();
        return;
      }

      if (e.key === 'g') {
        gPending.current = true;
        window.setTimeout(() => {
          gPending.current = false;
        }, 800);
        return;
      }

      if (gPending.current) {
        const item = SIDEBAR_NAV.find((n) => n.shortcut === e.key);
        if (item) {
          e.preventDefault();
          void navigate(item.path);
        }
        gPending.current = false;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [navigate, openHelp]);

  return null;
}
