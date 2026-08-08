import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Apple,
  Calendar,
  Dumbbell,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Settings,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const SIDEBAR_NAV: NavItem[] = [
  { path: '/', label: 'Today', icon: LayoutDashboard, shortcut: 't' },
  { path: '/train', label: 'Train', icon: Dumbbell, shortcut: 'r' },
  { path: '/fuel', label: 'Fuel', icon: Apple, shortcut: 'f' },
  { path: '/body', label: 'Body', icon: Activity, shortcut: 'b' },
  { path: '/coach', label: 'Coach', icon: MessageSquare, shortcut: 'c' },
  { path: '/settings', label: 'Settings', icon: Settings, shortcut: 's' },
];

export const MOBILE_TABS: NavItem[] = [
  { path: '/', label: 'Today', icon: Calendar },
  { path: '/train', label: 'Train', icon: Dumbbell },
  { path: '/fuel', label: 'Fuel', icon: Apple },
  { path: '/more', label: 'More', icon: MoreHorizontal },
];

export interface CommandAction {
  id: string;
  label: string;
  keywords?: string[];
  run: () => void;
}
