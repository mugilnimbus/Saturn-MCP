/* The "unsaved changes" bar. A settings tab marks the bar dirty when a field changes and registers what Save and
   Discard do; the settings screen shows the bar and asks before leaving a dirty tab. */

export class SaveBar {
  dirty = $state(false);
  /** Set while a field is invalid: Save is disabled until it is fixed. */
  invalid = $state(false);
  saving = $state(false);
  error = $state('');
  private onSave: (() => Promise<void>) | null = null;
  private onDiscard: (() => void) | null = null;

  /** Register the handlers for the current tab. */
  bind(handlers: { save: () => Promise<void>; discard: () => void }): void {
    this.onSave = handlers.save;
    this.onDiscard = handlers.discard;
  }

  async save(): Promise<void> {
    await this.onSave?.();
    this.dirty = false;
  }

  discard(): void {
    this.onDiscard?.();
    this.dirty = false;
    this.invalid = false;
    this.error = '';
  }
}
