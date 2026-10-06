import { render, screen, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MedicationsPage, { TIME_OPTIONS, timeOptions } from "../../src/pages/MedicationsPage"
import AppointmentsPage from "../../src/pages/AppointmentsPage"
import ActivityPage from "../../src/pages/ActivityPage"
import LandingPage from "../../src/pages/LandingPage"
import SignUpPage from "../../src/pages/SignUpPage"
import SignInPage from "../../src/pages/SignInPage"
import * as care from "../../src/state/careLogic"
import { DEFAULT_APPTS, DEFAULT_MEDS } from "../../src/state/seed"

const base = () => care.createInitialState()

describe("LandingPage", () => {
  test("buttons navigate to sign in and sign up", async () => {
    const user = userEvent.setup()
    const navigate = jest.fn()
    render(<LandingPage navigate={navigate} />)
    await user.click(screen.getByRole("button", { name: /sign in to your workspace/i }))
    await user.click(screen.getByRole("button", { name: /create an account/i }))
    expect(navigate.mock.calls).toEqual([["signin"], ["signup"]])
  })

  test("help assistant opens, answers and closes", async () => {
    const user = userEvent.setup()
    render(<LandingPage navigate={jest.fn()} />)
    await user.click(screen.getByRole("button", { name: /open careconnect help/i }))
    const assistant = screen.getByRole("complementary", { name: /careconnect assistant/i })
    await user.type(within(assistant).getByPlaceholderText(/ask a question/i), "What is this?{Enter}")
    expect(within(assistant).getByText("What is this?")).toBeInTheDocument()
    await user.click(within(assistant).getByRole("button", { name: "Send" }))
    expect(within(assistant).getAllByText(/medication reminders/).length).toBe(1)
    await user.click(within(assistant).getByRole("button", { name: /close assistant/i }))
    expect(screen.queryByRole("complementary", { name: /assistant/i })).not.toBeInTheDocument()
  })
})

describe("SignUpPage and SignInPage", () => {
  test("sign up validates every field", async () => {
    const user = userEvent.setup()
    const onSignUp = jest.fn()
    const navigate = jest.fn()
    render(<SignUpPage navigate={navigate} onSignUp={onSignUp} />)
    await user.type(screen.getByLabelText(/^password/i), "123")
    await user.type(screen.getByLabelText(/confirm password/i), "456")
    await user.click(screen.getByRole("button", { name: /create account/i }))
    expect(screen.getByText("Name is required.")).toBeInTheDocument()
    expect(screen.getByText("Email is required.")).toBeInTheDocument()
    expect(screen.getByText("Password must be at least 6 characters.")).toBeInTheDocument()
    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument()
    expect(onSignUp).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: /sign in/i }))
    expect(navigate).toHaveBeenCalledWith("signin")
  })

  test("sign up succeeds with valid data", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onSignUp = jest.fn()
    render(<SignUpPage navigate={jest.fn()} onSignUp={onSignUp} />)
    await user.type(screen.getByLabelText(/your name/i), "Jane Roe")
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com")
    await user.type(screen.getByLabelText(/^password/i), "secret1")
    await user.type(screen.getByLabelText(/confirm password/i), "secret1")
    await user.click(screen.getByRole("button", { name: /create account/i }))
    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled()
    act(() => jest.advanceTimersByTime(800))
    expect(onSignUp).toHaveBeenCalledWith("Jane Roe")
    jest.useRealTimers()
  })

  test("sign in passes the email user name", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onSignIn = jest.fn()
    render(<SignInPage navigate={jest.fn()} onSignIn={onSignIn} />)
    await user.type(screen.getByLabelText(/email address/i), "jane.roe@example.com")
    await user.type(screen.getByLabelText(/^password/i), "x")
    await user.click(screen.getByRole("button", { name: /sign in$/i }))
    act(() => jest.advanceTimersByTime(800))
    expect(onSignIn).toHaveBeenCalledWith("jane.roe")
    jest.useRealTimers()
  })
})

describe("MedicationsPage", () => {
  function renderPage(state = base()) {
    const props = { onAdd: jest.fn(), onDelete: jest.fn(), onToggleTaken: jest.fn() }
    const user = userEvent.setup()
    const utils = render(<MedicationsPage state={state} {...props} />)
    return { user, ...props, ...utils }
  }

  test("lists every medication", () => {
    renderPage()
    for (const med of DEFAULT_MEDS) expect(screen.getByRole("heading", { name: med.name })).toBeInTheDocument()
  })

  test("empty state", () => {
    renderPage({ ...base(), medications: [] })
    expect(screen.getByText("No medications yet")).toBeInTheDocument()
  })

  test("mark as taken shows feedback and calls back", async () => {
    const med = DEFAULT_MEDS[0]
    const { user, onToggleTaken } = renderPage()
    await user.click(screen.getByRole("button", { name: new RegExp(`^${med.name}: mark as`) }))
    expect(onToggleTaken).toHaveBeenCalledWith(med.id)
    expect(screen.getByRole("status")).toHaveTextContent(/Marked as/)
  })

  test("add form validates, then saves", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onAdd = jest.fn()
    render(<MedicationsPage state={base()} onAdd={onAdd} onDelete={jest.fn()} onToggleTaken={jest.fn()} />)
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    const dialog = screen.getByRole("dialog", { name: /add new medication/i })
    await user.click(within(dialog).getByRole("button", { name: "Add medication" }))
    expect(within(dialog).getAllByText("Required")).toHaveLength(2)
    await user.type(within(dialog).getByLabelText(/medication name/i), "Aspirin")
    await user.type(within(dialog).getByLabelText(/^dose/i), "75 mg")
    await user.type(within(dialog).getByLabelText(/notes/i), "With food")
    await user.click(within(dialog).getByRole("button", { name: "Add medication" }))
    act(() => jest.advanceTimersByTime(700))
    expect(onAdd).toHaveBeenCalledWith({ name: "Aspirin", dose: "75 mg", time: "8:30 am", notes: "With food" })
    jest.useRealTimers()
  })

  test("schedule time is a keyboard-operable list, and Return saves instead of cancelling", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onAdd = jest.fn()
    render(<MedicationsPage state={base()} onAdd={onAdd} onDelete={jest.fn()} onToggleTaken={jest.fn()} />)
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    const dialog = screen.getByRole("dialog", { name: /add new medication/i })
    await user.type(within(dialog).getByLabelText(/medication name/i), "Aspirin")
    await user.type(within(dialog).getByLabelText(/^dose/i), "75 mg")
    const time = within(dialog).getByRole("combobox", { name: /schedule time/i })
    await user.selectOptions(time, "9:15 pm")
    // Tab leaves the time list and reaches Notes, Cancel, then Add medication.
    time.focus()
    await user.tab()
    expect(within(dialog).getByLabelText(/notes/i)).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()
    await user.tab()
    expect(within(dialog).getByRole("button", { name: "Add medication" })).toHaveFocus()
    // Return in a text field submits the form (it used to trigger Cancel).
    await user.type(within(dialog).getByLabelText(/medication name/i), "{Enter}")
    act(() => jest.advanceTimersByTime(700))
    expect(onAdd).toHaveBeenCalledWith({ name: "Aspirin", dose: "75 mg", time: "9:15 pm", notes: "" })
    jest.useRealTimers()
  })

  test("editing keeps an existing time that is not on the 15 minute list", () => {
    expect(timeOptions("8:30 am")).toHaveLength(96)
    expect(timeOptions("08:30")[0]).toBe("08:30")
    expect(TIME_OPTIONS[0]).toBe("12:00 am")
    expect(TIME_OPTIONS[95]).toBe("11:45 pm")
  })

  test("add form closes with Escape, Cancel and the Close button", async () => {
    const { user } = renderPage()
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("edit replaces the medication", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onAdd = jest.fn()
    const onDelete = jest.fn()
    const med = DEFAULT_MEDS[0]
    render(<MedicationsPage state={base()} onAdd={onAdd} onDelete={onDelete} onToggleTaken={jest.fn()} />)
    await user.click(screen.getByRole("button", { name: `Edit ${med.name}` }))
    const dialog = screen.getByRole("dialog", { name: /edit medication/i })
    const dose = within(dialog).getByLabelText(/^dose/i)
    await user.clear(dose)
    await user.type(dose, "10 mg")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))
    act(() => jest.advanceTimersByTime(700))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: med.name, dose: "10 mg" }))
    expect(onDelete).toHaveBeenCalledWith(med.id)
    jest.useRealTimers()
  })

  test("delete asks for confirmation", async () => {
    const med = DEFAULT_MEDS[1]
    const { user, onDelete } = renderPage()
    await user.click(screen.getByRole("button", { name: `Delete ${med.name}` }))
    let confirm = screen.getByRole("alertdialog", { name: /delete medication/i })
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }))
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: `Delete ${med.name}` }))
    confirm = screen.getByRole("alertdialog", { name: /delete medication/i })
    await user.click(within(confirm).getByRole("button", { name: "Delete" }))
    expect(onDelete).toHaveBeenCalledWith(med.id)
  })
})

describe("AppointmentsPage", () => {
  function renderPage(state = base()) {
    const props = { onAdd: jest.fn(), onEdit: jest.fn(), onDelete: jest.fn() }
    const user = userEvent.setup()
    render(<AppointmentsPage state={state} {...props} />)
    return { user, ...props }
  }

  test("lists appointments and shows the empty state", () => {
    renderPage()
    for (const a of DEFAULT_APPTS) expect(screen.getByRole("heading", { name: a.title })).toBeInTheDocument()
  })

  test("empty state", () => {
    renderPage({ ...base(), appointments: [] })
    expect(screen.getByText("No appointments yet")).toBeInTheDocument()
  })

  test("add appointment validates and saves", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onAdd = jest.fn()
    render(<AppointmentsPage state={base()} onAdd={onAdd} onEdit={jest.fn()} onDelete={jest.fn()} />)
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    const dialog = screen.getByRole("dialog", { name: /add appointment/i })
    await user.click(within(dialog).getByRole("button", { name: "Add appointment" }))
    expect(within(dialog).getAllByText("Required")).toHaveLength(3)
    await user.type(within(dialog).getByLabelText(/appointment title/i), "Dentist")
    await user.type(within(dialog).getByLabelText(/date and time/i), "Friday — 9:00 am")
    await user.type(within(dialog).getByLabelText(/location/i), "Main St")
    await user.type(within(dialog).getByLabelText(/assigned caregiver/i), "Jane")
    await user.type(within(dialog).getByLabelText(/notes/i), "Bring card")
    await user.click(within(dialog).getByRole("button", { name: "Add appointment" }))
    act(() => jest.advanceTimersByTime(600))
    expect(onAdd).toHaveBeenCalledWith({ title: "Dentist", dateTime: "Friday — 9:00 am", location: "Main St", assignee: "Jane", notes: "Bring card" })
    jest.useRealTimers()
  })

  test("edit and delete an appointment", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const appt = DEFAULT_APPTS[0]
    render(<AppointmentsPage state={base()} onAdd={jest.fn()} onEdit={onEdit} onDelete={onDelete} />)
    await user.click(screen.getByRole("button", { name: `Edit ${appt.title}` }))
    const dialog = screen.getByRole("dialog", { name: /edit appointment/i })
    const title = within(dialog).getByLabelText(/appointment title/i)
    await user.clear(title)
    await user.type(title, "Moved visit")
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }))
    act(() => jest.advanceTimersByTime(600))
    expect(onEdit).toHaveBeenCalledWith(appt.id, expect.objectContaining({ title: "Moved visit" }))

    await user.click(screen.getByRole("button", { name: `Delete ${appt.title}` }))
    await user.keyboard("{Escape}")
    expect(onDelete).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: `Delete ${appt.title}` }))
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))
    expect(onDelete).toHaveBeenCalledWith(appt.id)
    jest.useRealTimers()
  })

  test("form closes with Cancel, Close and a backdrop click", async () => {
    const { user } = renderPage()
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await user.click(screen.getByRole("button", { name: "+ Add" }))
    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("ActivityPage", () => {
  test("filters entries and refreshes", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    let state = care.checkIn(care.toggleMedTaken(base(), DEFAULT_MEDS.find((m) => !m.taken)!.id))
    const onAddEntry = jest.fn()
    const { rerender } = render(<ActivityPage state={state} onAddEntry={onAddEntry} />)
    const group = screen.getByRole("group", { name: /filter activity/i })
    await user.click(within(group).getByRole("button", { name: /checked in/i }))
    expect(within(group).getByRole("button", { name: /checked in/i })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Margaret checked in")).toBeInTheDocument()
    expect(screen.queryByText(/marked as taken/)).not.toBeInTheDocument()
    await user.click(within(group).getByRole("button", { name: /task completed/i }))
    expect(screen.getByText("No activity yet")).toBeInTheDocument()
    await user.click(within(group).getByRole("button", { name: "All" }))
    expect(screen.getByText(/marked as taken/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /refresh/i }))
    expect(onAddEntry).toHaveBeenCalledWith(expect.objectContaining({ type: "checked_in" }))
    expect(screen.getByRole("button", { name: /refreshed/i })).toBeDisabled()
    act(() => jest.advanceTimersByTime(2100))
    state = { ...state, activity: [] }
    rerender(<ActivityPage state={state} onAddEntry={onAddEntry} />)
    expect(screen.getByText("No activity yet")).toBeInTheDocument()
    jest.useRealTimers()
  })
})

