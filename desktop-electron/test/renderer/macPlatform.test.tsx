/* eslint-disable @typescript-eslint/no-require-imports */

// IS_MAC is a module-level constant in AppShell, so the module graph must be
// loaded after navigator.platform is changed. React, Testing Library and the
// app are all required inside one isolated registry (at file level, because
// Testing Library registers Jest hooks when imported) so that they share a
// single copy of React. No desktop bridge is installed, so the in-page F1 handler is active. jsdom is per test file, so the change cannot leak.
Object.defineProperty(window.navigator, "platform", { value: "MacIntel", configurable: true })

let React: typeof import("react")
let rtl: typeof import("@testing-library/react")
let MacApp: typeof import("../../src/App").default
jest.isolateModules(() => {
  React = require("react")
  rtl = require("@testing-library/react")
  MacApp = require("../../src/App").default
})

describe("macOS renderer variant", () => {
  test("shows the command key and the macOS menu bar shortcut row", async () => {
    const { render, screen, act, fireEvent } = rtl
    await act(async () => {
      render(React.createElement(MacApp))
    })

    fireEvent.click(screen.getByRole("button", { name: /sign in to your workspace/i }))
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane.roe@example.com" } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "asdf" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in$/i }))
    const nav = await screen.findByRole("navigation", {}, { timeout: 3000 })

    expect(nav.textContent).toContain("⌘")
    expect(document.body.textContent).toContain("⌘F")
    expect(document.body.textContent).not.toContain("Ctrl+F")

    fireEvent.keyDown(document.body, { key: "F1" })
    const dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i })
    expect(dialog).toHaveTextContent("Move to the menu bar")
    expect(dialog).toHaveTextContent("Ctrl+F2 (VoiceOver: VO+M)")
    expect(dialog).not.toHaveTextContent("Alt+F / E / V / H")
  })
})
