import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing').then((module) => ({ default: module.Landing })));
const RoutedWorkspace = lazy(() => import('./components/RoutedWorkspace').then((module) => ({ default: module.RoutedWorkspace })));

function RouteLoading() {
  return <main className="route-loading" role="status" aria-label="Loading PrecedentOS"><span/>Loading workspace</main>;
}

export function App() {
  const location = useLocation();
  return <Suspense fallback={<RouteLoading/>}>{location.pathname === '/' ? <Landing/> : <RoutedWorkspace/>}</Suspense>;
}
