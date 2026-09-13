import { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const RpgApp = lazy(() => import('./rpg/App.tsx'));
const LegacyApp = lazy(() => import('./app/LegacyApp.tsx'));

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <main style={{ padding: '3rem', color: '#f2ead5', fontFamily: 'system-ui' }}><h1>The expedition was interrupted.</h1><p>Your stored save has not been reset. Reload the page to restore it. Save recovery is available in Settings.</p><button onClick={() => window.location.reload()}>Reload the expedition</button></main> : this.props.children;
  }
}

export function AppRouter() {
  const [legacy, setLegacy] = useState(window.location.hash === '#episodes');
  useEffect(() => {
    const change = () => setLegacy(window.location.hash === '#episodes');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.body.dataset.app = legacy ? 'legacy' : 'rpg';
    document.title = legacy ? 'SE Learning Quest · Learning episodes' : 'Asterfall: The Last Relay · SE Learning Quest';
  }, [legacy]);
  return <AppBoundary><Suspense fallback={<main style={{ padding: '3rem', color: '#e6d9b4', fontFamily: 'system-ui' }} role="status">Lighting the relay…</main>}>{legacy ? <LegacyApp /> : <RpgApp />}</Suspense></AppBoundary>;
}
