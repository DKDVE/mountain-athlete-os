import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppShell } from '@/features/shell/AppShell';
import { ProgramHubPage } from '@/features/program/ProgramHubPage';
import { StubPage } from '@/features/shell/StubPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { MorePage } from '@/features/more/MorePage';
import { TodayPage } from '@/features/today/TodayPage';
import { WorkoutLoggerPage } from '@/features/workout/WorkoutLoggerPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { ComponentGallery } from '@/features/dev/ComponentGallery';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<TodayPage />} />
        <Route path="train" element={<StubPage title="Train" />} />
        <Route path="train/program" element={<ProgramHubPage />} />
        <Route path="train/log/:sessionId" element={<WorkoutLoggerPage />} />
        <Route path="fuel" element={<StubPage title="Fuel" />} />
        <Route path="body" element={<StubPage title="Body" />} />
        <Route path="coach" element={<StubPage title="Coach" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="more" element={<MorePage />} />
        {import.meta.env.DEV ? <Route path="dev/components" element={<ComponentGallery />} /> : null}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
