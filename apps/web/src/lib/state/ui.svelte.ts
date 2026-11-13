/* Screen-level UI state shared by the shell: a pending yes/no question, and whether the app is at
   phone width (where the side panel becomes a bottom tab bar). */

/** A yes/no question shown in the app's own dialog (browser popups are blocked in embedded panes). */
export interface Question {
  title: string;
  body: string;
  action: string;
  danger?: boolean;
  resolve: (yes: boolean) => void;
}

export const NARROW_PX = 760;

class Ui {
  question = $state<Question | null>(null);
  width = $state(window.innerWidth);
  narrow = $derived(this.width <= NARROW_PX);

  constructor() {
    window.addEventListener('resize', () => (this.width = window.innerWidth));
  }

  /** Ask before a discarding action. Resolves true only when the user confirms. */
  ask(question: Omit<Question, 'resolve'>): Promise<boolean> {
    this.question?.resolve(false);
    return new Promise((resolve) => (this.question = { ...question, resolve }));
  }

  answer(yes: boolean): void {
    this.question?.resolve(yes);
    this.question = null;
  }
}

export const ui = new Ui();
