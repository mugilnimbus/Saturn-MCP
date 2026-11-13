import { router } from '../../lib/state/router.svelte';
import type { Section } from '../../lib/state/routes';

/** The top-level sections, shown in the side panel (wide) and the tab bar (narrow). */
export const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Overview', icon: 'overview' },
  { id: 'runs', label: 'Runs', icon: 'runs' },
  { id: 'artifacts', label: 'Artifacts', icon: 'box' },
  { id: 'model', label: 'Model', icon: 'chip' },
  { id: 'connections', label: 'Connections', icon: 'link' },
  { id: 'settings', label: 'Settings', icon: 'set' },
];

export function goSection(section: Section): void {
  if (section === 'home') return router.go({ name: 'home' });
  if (section === 'settings') return router.go({ name: 'settings', tab: 'model' });
  router.go({ name: section });
}
