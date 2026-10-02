import "@testing-library/jest-dom"

// jsdom does not implement matchMedia; the app reads it for theme and contrast.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

// jsdom has no layout engine; scrollIntoView is a no-op there.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined
}

afterEach(() => {
  delete window.careConnect
  localStorage.clear()
  document.documentElement.className = ""
  document.documentElement.removeAttribute("style")
  document.body.className = ""
})
