/* The few per-project settings. */

export const config = {
  /** Shown in the side panel and the browser title. */
  appName: 'Saturn',
  /** Prefix for everything saved in localStorage, so two apps on one origin do not clash. */
  storagePrefix: 'saturn',
  /** Sent on state-changing requests. */
  clientHeader: { name: 'X-Client', value: 'web' },
} as const;
