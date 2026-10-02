// Automated accessibility checks (axe-core) for every major screen and dialog.
// These catch missing names, roles, labels and ARIA misuse. Colour contrast is
// not checked here because jsdom does not compute styles; it is covered by the
// manual high-contrast checks in docs/week8/ACCESSIBILITY_TESTING.md.
import { screen } from "@testing-library/react"
import { axe } from "jest-axe"
import { goTo, installBridge, setup, signIn } from "./helpers"

jest.setTimeout(20000)

const options = { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } }

async function expectNoViolations() {
  const results = await axe(document.body, options)
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
  expect(summary).toEqual([])
}

test("landing and sign-in pages", async () => {
  const { user } = setup()
  await expectNoViolations()
  await user.click(screen.getByRole("button", { name: /sign in to your workspace/i }))
  await expectNoViolations()
})

test.each(["Overview", "Medications", "Appointments", "Activity", "Messages"])("%s screen (desktop shell)", async (page) => {
  installBridge()
  const { user } = setup()
  await signIn(user)
  await goTo(user, page)
  await expectNoViolations()
})

test("settings, shortcuts and emergency dialogs", async () => {
  const { user } = setup()
  await signIn(user)
  await user.click(screen.getByRole("button", { name: /open settings/i }))
  await expectNoViolations()
  await user.keyboard("{Escape}")
  await user.keyboard("{F1}")
  await expectNoViolations()
  await user.keyboard("{Escape}")
  await user.click(screen.getByRole("button", { name: /emergency/i }))
  await expectNoViolations()
})

test("medication and appointment forms", async () => {
  const { user } = setup()
  await signIn(user)
  await goTo(user, "Medications")
  await user.click(screen.getByRole("button", { name: "+ Add" }))
  await expectNoViolations()
  await user.keyboard("{Escape}")
  await goTo(user, "Appointments")
  await user.click(screen.getByRole("button", { name: "+ Add" }))
  await expectNoViolations()
})
