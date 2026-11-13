/* The current route, kept in the URL hash so reload, back, and deep links work. */

import { parseRoute, routeHref, sectionOf, type Route } from './routes';

class Router {
  route = $state<Route>(parseRoute(location.hash));
  section = $derived(sectionOf(this.route));
  beforeLeave: (() => Promise<boolean>) | null = null;
  private navigating = false;

  constructor() {
    window.addEventListener('hashchange', () => {
      const next = parseRoute(location.hash);
      history.replaceState(null, '', routeHref(this.route));
      this.go(next, true);
    });
  }

  go(route: Route, replace = false): void {
    void this.navigate(route, replace);
  }

  private async navigate(route: Route, replace: boolean): Promise<void> {
    if (this.navigating) return;
    this.navigating = true;
    try {
      if (this.beforeLeave && !await this.beforeLeave()) return;
    const href = routeHref(route);
    if (replace) history.replaceState(null, '', href);
    else if (location.hash !== href) history.pushState(null, '', href);
    this.route = route;
    } finally { this.navigating = false; }
  }
}

export const router = new Router();
