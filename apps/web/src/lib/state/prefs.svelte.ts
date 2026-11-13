/* Per-browser conveniences: theme, density, and the side panel width. Stored in localStorage, which can be
   unavailable (private windows, blocked storage), so every access is guarded and the app works without it. */

import { config } from '../../config';

export type Theme = 'black' | 'white';
export type Density = 'comfortable' | 'compact';

export const NAV_MIN = 200;
export const NAV_MAX = 440;

const key = (name: string) => `${config.storagePrefix}.${name}`;

function read(name: string): string | null {
  try {
    return localStorage.getItem(key(name));
  } catch {
    return null;
  }
}

function write(name: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key(name));
    else localStorage.setItem(key(name), value);
  } catch {
    /* storage unavailable: keep the value for this session only */
  }
}

class Prefs {
  theme = $state<Theme>(read('theme') === 'white' ? 'white' : 'black');
  density = $state<Density>(read('density') === 'compact' ? 'compact' : 'comfortable');
  navWidth = $state<number | null>(Number(read('navWidth')) || null);

  setTheme(theme: Theme): void {
    this.theme = theme;
    document.documentElement.dataset.theme = theme;
    write('theme', theme);
  }

  setDensity(density: Density): void {
    this.density = density;
    document.documentElement.dataset.density = density;
    write('density', density === 'compact' ? 'compact' : null);
  }

  setNavWidth(width: number | null): void {
    this.navWidth = width === null ? null : Math.round(Math.min(NAV_MAX, Math.max(NAV_MIN, width)));
    write('navWidth', this.navWidth === null ? null : String(this.navWidth));
  }
}

export const prefs = new Prefs();
document.documentElement.dataset.theme = prefs.theme;
document.documentElement.dataset.density = prefs.density;
