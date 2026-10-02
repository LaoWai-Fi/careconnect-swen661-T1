import { useState } from "react"
import { render, screen, within, act, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DashboardPage from "../../src/pages/DashboardPage"
import * as care from "../../src/state/careLogic"
import type { AppState, Page } from "../../src/types"

function Harness({ initial, navigate, onView }: { initial: AppState; navigate: (p: Page) => void; onView: (id: string) => void }) {
  const [state, setState] = useState(initial)
  return (
    <DashboardPage
      state={state}
      navigate={navigate}
      onToggleWidget={(id) => setState((s) => care.toggleWidget(s, id))}
      onReorderWidgets={(widgets) => setState((s) => ({ ...s, dashboardWidgets: widgets }))}
      onToggleMedTaken={(id) => setState((s) => care.toggleMedTaken(s, id))}
      onCheckIn={() => setState((s) => care.checkIn(s))}
      onViewMessage={onView}
    />
  )
}

function renderDashboard(initial = care.createInitialState()) {
  jest.useFakeTimers()
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
  const navigate = jest.fn()
  const onView = jest.fn()
  const utils = render(<Harness initial={initial} navigate={navigate} onView={onView} />)
  return { user, navigate, onView, ...utils }
}

afterEach(() => jest.useRealTimers())

const sectionNames = () => screen.getAllByRole("region").map((r) => r.getAttribute("aria-label"))

describe("DashboardPage", () => {
  test("shows all widgets in order and the progress bar", () => {
    renderDashboard()
    expect(sectionNames()).toEqual(["Status overview", "Alerts", "Today's medications", "Next appointment", "Unread messages"])
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax")
  })

  test("check-in from the status card records it once", async () => {
    const { user } = renderDashboard()
    const checkIn = screen.getByRole("button", { name: /check-in/i })
    await user.click(checkIn)
    expect(screen.getByText(/check-in recorded/i)).toBeInTheDocument()
    expect(screen.getByText("Done")).toBeInTheDocument()
    await user.click(checkIn)
    act(() => jest.advanceTimersByTime(3100))
    expect(screen.queryByText(/check-in recorded/i)).not.toBeInTheDocument()
  })

  test("medication quick toggle marks taken and unmarks", async () => {
    const { user } = renderDashboard()
    const meds = within(screen.getByRole("region", { name: "Today's medications" }))
    const first = meds.getAllByRole("button", { name: /mark as/ })[0]
    const wasTaken = /not taken/.test(first.getAttribute("aria-label")!)
    await user.click(first)
    expect(meds.getByText(wasTaken ? /Unmarked/ : /Taken!/)).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(2100))
    await user.click(meds.getAllByRole("button", { name: /mark as/ })[0])
    expect(meds.getByText(wasTaken ? /Taken!/ : /Unmarked/)).toBeInTheDocument()
  })

  test("cards and links navigate", async () => {
    const { user, navigate, onView } = renderDashboard()
    const status = within(screen.getByRole("region", { name: "Status overview" }))
    await user.click(status.getByRole("button", { name: /^💊\s*Medications/ }))
    await user.click(status.getByRole("button", { name: /Next Appointment/i }))
    await user.click(screen.getAllByRole("button", { name: /view all/i })[0])
    const unread = within(screen.getByRole("region", { name: "Unread messages" }))
    await user.click(unread.getAllByRole("button", { name: /unread message from/i })[0])
    expect(navigate).toHaveBeenCalledWith("medications")
    expect(navigate).toHaveBeenCalledWith("appointments")
    expect(onView).toHaveBeenCalled()
  })

  test("alerts can be dismissed", async () => {
    const { user } = renderDashboard()
    const alerts = within(screen.getByRole("region", { name: "Alerts" }))
    const count = alerts.getAllByRole("button", { name: /dismiss alert/i }).length
    await user.click(alerts.getAllByRole("button", { name: /dismiss alert/i })[0])
    expect(alerts.queryAllByRole("button", { name: /dismiss alert/i })).toHaveLength(count - 1)
  })

  test("customize: hide a widget, reorder with buttons and close with Done", async () => {
    const { user } = renderDashboard()
    await user.click(screen.getByRole("button", { name: /customize dashboard/i }))
    const dialog = screen.getByRole("dialog", { name: /customize dashboard/i })
    await user.click(within(dialog).getByRole("switch", { name: /^Alerts/ }))
    expect(within(dialog).getByRole("switch", { name: /^Alerts/ })).toHaveAttribute("aria-checked", "false")
    await user.click(within(dialog).getByRole("button", { name: /move unread messages up/i }))
    expect(within(dialog).getByRole("button", { name: /move margaret's status up/i })).toBeDisabled()
    await user.click(within(dialog).getByRole("button", { name: /move margaret's status down/i }))
    await user.click(within(dialog).getByRole("button", { name: "Done" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(sectionNames()).toEqual(["Status overview", "Today's medications", "Unread messages", "Next appointment"])
  })

  test("customize: drag and drop reorders (mouse users) and Escape closes", async () => {
    const { user } = renderDashboard()
    await user.click(screen.getByRole("button", { name: /customize dashboard/i }))
    const dialog = screen.getByRole("dialog", { name: /customize dashboard/i })
    const rows = Array.from(dialog.querySelectorAll<HTMLElement>("[draggable]"))
    fireEvent.dragStart(rows[4])
    fireEvent.dragOver(rows[0])
    // Hovering the row being dragged is a no-op.
    fireEvent.dragOver(rows[4])
    fireEvent.dragEnd(rows[0])
    const labels = Array.from(dialog.querySelectorAll("[draggable]")).map((r) => r.textContent)
    expect(labels[0]).toMatch(/Unread messages/)
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(sectionNames()[0]).toBe("Unread messages")
  })

  test("empty data still renders", () => {
    const state = { ...care.createInitialState(), medications: [], appointments: [], messages: [] }
    renderDashboard(state)
    expect(screen.getByText(/0 of 1 tasks done/)).toBeInTheDocument()
  })
})
