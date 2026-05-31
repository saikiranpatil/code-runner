import { Outlet } from 'react-router-dom';
import SidePanel from './SidePanel';

/**
 * Shared auth layout — renders the left SidePanel on lg+ screens,
 * and the current child route (Login or Register) on the right.
 *
 * In App.tsx, nest /login and /register under this layout:
 *
 *   <Route element={<PublicRoute />}>
 *     <Route element={<AuthPage />}>
 *       <Route path={URLs.auth.login}    element={<LoginPage />} />
 *       <Route path={URLs.auth.register} element={<RegisterPage />} />
 *     </Route>
 *   </Route>
 */
export default function AuthPage() {
  return (
    <div className="h-full grid lg:grid-cols-2">
      <SidePanel />
      <Outlet />
    </div>
  );
}