type EventHandler = (target: HTMLElement, event: Event) => void;

function ensureUiRoot(): HTMLElement {
  const existing = document.getElementById('ui-root');
  if (existing) return existing;

  const root = document.createElement('div');
  root.id = 'ui-root';
  document.body.append(root);
  return root;
}

export class UiLayer {
  private readonly root: HTMLElement;
  private readonly listeners: Array<() => void> = [];

  constructor(viewName: string) {
    this.root = ensureUiRoot();
    this.root.dataset.view = viewName;
  }

  render(markup: string): void {
    this.clearListeners();
    this.root.innerHTML = `<div class="ui-view">${markup}</div>`;
  }

  on(eventName: keyof HTMLElementEventMap, selector: string, handler: EventHandler): void {
    const listener = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest(selector) : null;
      if (target instanceof HTMLElement && this.root.contains(target)) {
        handler(target, event);
      }
    };
    this.root.addEventListener(eventName, listener);
    this.listeners.push(() => this.root.removeEventListener(eventName, listener));
  }

  getElement<T extends HTMLElement>(selector: string): T | null {
    const match = this.root.querySelector(selector);
    return match instanceof HTMLElement ? (match as T) : null;
  }

  destroy(): void {
    this.clearListeners();
    this.root.innerHTML = '';
    this.root.removeAttribute('data-view');
  }

  private clearListeners(): void {
    while (this.listeners.length > 0) {
      this.listeners.pop()?.();
    }
  }
}
