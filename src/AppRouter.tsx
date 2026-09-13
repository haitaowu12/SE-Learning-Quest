import { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const RpgApp = lazy(() => import('./rpg/App.tsx'));
const LegacyApp = lazy(() => import('./app/LegacyApp.tsx'));
const AdventureApp = lazy(() => import('./adventure/App.tsx'));
const CouncilApp = lazy(() => import('./adventure/council/App.tsx'));
const ArchiveApp = lazy(() => import('./adventure/archive/App.tsx'));
const currentRoute = () => window.location.hash === '#episodes' ? 'legacy' : window.location.hash === '#adventure/archive' ? 'archive' : window.location.hash === '#adventure/council' ? 'council' : window.location.hash === '#adventure' ? 'adventure' : 'classic';

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main style={{ padding: '3rem', color: '#f2ead5', fontFamily: 'system-ui' }}><h1>The expedition was interrupted.</h1><p>Your stored save has not been reset. Reload the page to restore it. Save recovery is available in Settings.</p><button onClick={() => window.location.reload()}>Reload the expedition</button></main> : this.props.children;
  }
}

export function AppRouter() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const change = () => setRoute(currentRoute());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.body.dataset.app = route === 'classic' ? 'rpg' : route === 'council' || route === 'archive' ? 'adventure' : route;
    document.title = route === 'legacy' ? 'SE Learning Quest · Learning episodes' : route === 'archive' ? 'Asterfall · The Green Tally · Illustrated RPG' : route === 'council' ? 'Asterfall · The Missing Address · Illustrated RPG' : route === 'adventure' ? 'Asterfall · The Missing Keeper · Illustrated RPG' : 'Asterfall: The Last Relay · SE Learning Quest';
  }, [route]);
  return <AppBoundary><Suspense fallback={<main style={{ padding: '3rem', color: '#e6d9b4', fontFamily: 'system-ui' }} role="status">Lighting the relay…</main>}>{route === 'legacy' ? <LegacyApp /> : route === 'archive' ? <ArchiveApp /> : route === 'council' ? <CouncilApp /> : route === 'adventure' ? <AdventureApp /> : <RpgApp />}</Suspense></AppBoundary>;
}
