import type { AssetManifest } from '../types/index.ts';

export const assetManifest: AssetManifest = {
  version: 1,
  assets: [
    { key: 'platform-hero', path: 'assets/learning-quest/platform-hero.webp', fallbackPath: 'assets/learning-quest/platform-hero.png', width: 1536, height: 864, priority: 'critical' },
    { key: 'rail-title', path: 'assets/learning-quest/rail-title.webp', fallbackPath: 'assets/learning-quest/rail-title.png', width: 1536, height: 864, priority: 'critical' },
    { key: 'rail-map', path: 'assets/learning-quest/rail-map.webp', fallbackPath: 'assets/learning-quest/rail-map.png', width: 1536, height: 864, priority: 'critical' },
    { key: 'rail-mission-anchor', path: 'assets/learning-quest/rail-mission-anchor.webp', fallbackPath: 'assets/learning-quest/rail-mission-anchor.png', width: 1536, height: 864, priority: 'standard' },
    { key: 'rail-debrief-readiness', path: 'assets/learning-quest/rail-debrief-readiness.webp', fallbackPath: 'assets/learning-quest/rail-debrief-readiness.png', width: 1536, height: 864, priority: 'standard' },
    { key: 'coffee-frame', path: 'assets/coffee-lab/frame.webp', fallbackPath: 'assets/coffee-lab/frame.png', width: 1024, height: 1024, priority: 'critical' },
    { key: 'coffee-define', path: 'assets/coffee-lab/define.webp', fallbackPath: 'assets/coffee-lab/define.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-architect', path: 'assets/coffee-lab/architect.webp', fallbackPath: 'assets/coffee-lab/architect.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-implement', path: 'assets/coffee-lab/implement.webp', fallbackPath: 'assets/coffee-lab/implement.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-integrate', path: 'assets/coffee-lab/integrate.webp', fallbackPath: 'assets/coffee-lab/integrate.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-prove', path: 'assets/coffee-lab/prove.webp', fallbackPath: 'assets/coffee-lab/prove.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-operate', path: 'assets/coffee-lab/operate.webp', fallbackPath: 'assets/coffee-lab/operate.png', width: 1024, height: 1024, priority: 'standard' },
    { key: 'coffee-retire', path: 'assets/coffee-lab/retire.webp', fallbackPath: 'assets/coffee-lab/retire.png', width: 1024, height: 1024, priority: 'standard' },
  ],
};

export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
