import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './AppRouter.tsx';

const uiRoot = document.getElementById('ui-root');
if (!uiRoot) {
  throw new Error('Missing #ui-root mount point');
}

createRoot(uiRoot).render(createElement(AppRouter));
