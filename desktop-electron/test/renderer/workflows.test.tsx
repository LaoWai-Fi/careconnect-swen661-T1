// End-to-end style workflows through the whole <App/>, with the Electron
// bridge present, covering the test plan's happy paths on desktop.
import { screen, within, waitFor, fireEvent } from "@testing-library/react"
import { goTo, installBridge, setup, signIn } from "./helpers"

jest.setTimeout(15000)

test("caregiver manages medications, appointments, activity and messages; everything is autosaved", async () => {
  const bridge = installBridge()
  const { user } = setup()
  await signIn(user)

  // Medications: add, mark taken, delete
  await goTo(user, "Medications")
  await user.click(screen.getByRole("button", { name: "+ Add" }))
  const medDialog = screen.getByRole("dialog", { name: /add new medication/i })
  await user.type(within(medDialog).getByLabelText(/medication name/i), "Vitamin D")
  await user.type(within(medDialog).getByLabelText(/^dose/i), "1000 IU")
  await user.click(within(medDialog).getByRole("button", { name: "Add medication" }))
  expect(await screen.findByRole("heading", { name: "Vitamin D" }, { timeout: 2000 })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: /^Vitamin D: mark as taken/ }))
  await user.click(screen.getByRole("button", { name: "Delete Vitamin D" }))
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))
  expect(screen.queryByRole("heading", { name: "Vitamin D" })).not.toBeInTheDocument()

  // Appointments: add, edit, delete
  await goTo(user, "Appointments")
  await user.click(screen.getByRole("button", { name: "+ Add" }))
  const apptDialog = screen.getByRole("dialog", { name: /add appointment/i })
  await user.type(within(apptDialog).getByLabelText(/appointment title/i), "Podiatry")
  await user.type(within(apptDialog).getByLabelText(/date and time/i), "Monday — 9:00 am")
  await user.type(within(apptDialog).getByLabelText(/location/i), "Clinic")
  await user.click(within(apptDialog).getByRole("button", { name: "Add appointment" }))
  expect(await screen.findByRole("heading", { name: "Podiatry" }, { timeout: 2000 })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Edit Podiatry" }))
  const edit = screen.getByRole("dialog", { name: /edit appointment/i })
  await user.type(within(edit).getByLabelText(/location/i), " B")
  await user.click(within(edit).getByRole("button", { name: "Save changes" }))
  expect(await screen.findByText("Clinic B", {}, { timeout: 2000 })).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Delete Podiatry" }))
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))

  // Activity: refresh adds a check-in entry
  await goTo(user, "Activity")
  await user.click(screen.getByRole("button", { name: /refresh/i }))
  expect(screen.getAllByText(/checked in via dashboard/).length).toBe(1)

  // Dashboard: customize, toggle med, open unread message
  await goTo(user, "Overview")
  await user.click(screen.getByRole("button", { name: /customize dashboard/i }))
  const custom = screen.getByRole("dialog", { name: /customize dashboard/i })
  await user.click(within(custom).getByRole("switch", { name: /^Alerts/ }))
  await user.click(within(custom).getByRole("button", { name: /move unread messages up/i }))
  fireEvent.dragStart(custom.querySelectorAll("[draggable]")[1])
  fireEvent.dragOver(custom.querySelectorAll("[draggable]")[0])
  await user.click(within(custom).getByRole("button", { name: "Done" }))
  const meds = within(screen.getByRole("region", { name: "Today's medications" }))
  await user.click(meds.getAllByRole("button", { name: /mark as/ })[0])
  const unread = within(screen.getByRole("region", { name: "Unread messages" }))
  await user.click(unread.getAllByRole("button", { name: /unread message from/i })[0])

  // Messages: detail view, toggle read, archive, reply + send, delete
  await user.click(screen.getByRole("button", { name: "Mark as unread" }))
  await user.click(screen.getByRole("button", { name: /^Reply to/ }))
  await user.type(screen.getByLabelText(/^body/i), "Thanks!")
  await user.click(screen.getByRole("button", { name: "Send" }))
  const list = within(screen.getByRole("list", { name: /inbox messages/i }))
  await user.click(list.getAllByRole("button", { name: /^Mark message from/ })[0])
  await user.click(list.getAllByRole("button", { name: /^(Unread message|Message) from/ })[1])
  await user.click(screen.getByRole("button", { name: "Archive message" }))
  await user.click(within(screen.getByRole("group", { name: /message folders/i })).getByRole("button", { name: /archive/i }))
  await user.click(within(screen.getByRole("list", { name: /archived messages/i })).getAllByRole("button", { name: /from/ })[1])
  await user.click(screen.getByRole("button", { name: /unarchive message and move/i }))
  await user.click(within(screen.getByRole("group", { name: /message folders/i })).getByRole("button", { name: /inbox/i }))
  await user.click(within(screen.getByRole("list", { name: /inbox messages/i })).getAllByRole("button", { name: /^(Unread message|Message) from/ })[1])
  await user.click(screen.getByRole("button", { name: "Delete message" }))
  await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))

  // Settings: font size goes through App state
  await user.click(screen.getByRole("button", { name: /open settings/i }))
  await user.click(within(screen.getByRole("dialog", { name: /settings/i })).getByRole("button", { name: "large" }))
  await user.keyboard("{Escape}")

  await waitFor(() => expect(bridge.saveCareData).toHaveBeenCalled(), { timeout: 3000 })
  await waitFor(() => expect((bridge.saveCareData.mock.calls.at(-1)![0] as { fontSize: string }).fontSize).toBe("large"))
  const last = bridge.saveCareData.mock.calls.at(-1)![0] as { fontSize: string; messages: { subject: string }[] }
  expect(last.messages.some((m) => m.subject.startsWith("Re: "))).toBe(true)
})

test("dialogs trap keyboard focus (Tab and Shift+Tab wrap)", async () => {
  const { user } = setup()
  await signIn(user)
  await user.keyboard("{F1}")
  const dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i })
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
  const focusable = within(dialog).getAllByRole("button")
  focusable[focusable.length - 1].focus()
  await user.tab()
  expect(focusable[0]).toHaveFocus()
  await user.tab({ shift: true })
  expect(focusable[focusable.length - 1]).toHaveFocus()
})

test("dashboard check-in and undo both appear in the Activity log", async () => {
  installBridge()
  const { user } = setup()
  await signIn(user)
  await user.click(screen.getByRole("button", { name: /press to record margaret's check-in/i }))
  await user.click(screen.getByRole("button", { name: /press to undo the check-in/i }))
  await goTo(user, "Activity")
  expect(screen.getByText("Margaret checked in")).toBeInTheDocument()
  expect(screen.getByText("Margaret's check-in was undone")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Check-in undone" }))
  expect(screen.queryByText("Margaret checked in")).not.toBeInTheDocument()
})

test("toolbar New message opens a blank compose form, also when Messages is already open", async () => {
  installBridge()
  const { user } = setup()
  await signIn(user)
  const toolbar = screen.getByRole("toolbar", { name: "Primary actions" })
  await user.click(within(toolbar).getByRole("button", { name: /new message/i }))
  expect(await screen.findByRole("heading", { name: "New Message" })).toBeInTheDocument()
  expect(screen.queryByRole("button", { name: /compose new message/i })).not.toBeInTheDocument()

  // From the Messages list itself
  await user.click(screen.getByRole("button", { name: /back to messages|← back/i }))
  expect(screen.getByRole("button", { name: /compose new message/i })).toBeInTheDocument()
  await user.click(within(toolbar).getByRole("button", { name: /new message/i }))
  expect(await screen.findByRole("heading", { name: "New Message" })).toBeInTheDocument()
})
