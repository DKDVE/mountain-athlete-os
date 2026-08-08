import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useShellStore } from '@/features/shell/shell-store';

export function HelpSheet() {
  const open = useShellStore((s) => s.helpOpen);
  const closeHelp = useShellStore((s) => s.closeHelp);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) useShellStore.getState().openHelp();
        else closeHelp();
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Keyboard shortcuts</SheetTitle>
        </SheetHeader>
        <ul className="mt-6 space-y-3 font-mono text-sm">
          <li><kbd className="rounded border px-1">⌘</kbd> + <kbd className="rounded border px-1">K</kbd> — Command palette</li>
          <li><kbd className="rounded border px-1">G</kbd> then <kbd className="rounded border px-1">T</kbd> — Today</li>
          <li><kbd className="rounded border px-1">G</kbd> then <kbd className="rounded border px-1">R</kbd> — Train</li>
          <li><kbd className="rounded border px-1">G</kbd> then <kbd className="rounded border px-1">F</kbd> — Fuel</li>
          <li><kbd className="rounded border px-1">?</kbd> — This help sheet</li>
        </ul>
      </SheetContent>
    </Sheet>
  );
}
