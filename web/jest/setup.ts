import '@testing-library/jest-dom';

// jsdom has no matchMedia; the app layout listens for breakpoint changes.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom does not implement these browser APIs used by the app.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}
window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = jest.fn();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/');
});
