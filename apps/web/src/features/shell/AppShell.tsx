import { OfflineBanner } from '@/features/shell/OfflineBanner';
import { Sidebar } from '@/features/shell/Sidebar';
import { MobileTabBar } from '@/features/shell/MobileTabBar';
import { TopBar } from '@/features/shell/TopBar';
import { CommandPalette } from '@/features/shell/CommandPalette';
import { KeyboardShortcuts } from '@/features/shell/KeyboardShortcuts';
import { HelpSheet } from '@/features/shell/HelpSheet';
import { Outlet } from 'react-router-dom';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineBanner />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto flex-1 overflow-auto p-4 md:p-6 xl:max-w-6xl">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileTabBar />
      <CommandPalette />
      <KeyboardShortcuts />
      <HelpSheet />
    </div>
  );
}
