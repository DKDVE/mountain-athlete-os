import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';

export function App() {
  const basePath = import.meta.env.VITE_APP_BASE_PATH || '/';
  return (
    <BrowserRouter basename={basePath === '/' ? undefined : basePath.replace(/\/$/, '')}>
      <AppRouter />
    </BrowserRouter>
  );
}
