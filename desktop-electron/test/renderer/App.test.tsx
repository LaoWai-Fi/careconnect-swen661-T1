import { screen, waitFor, within, act } from "@testing-library/react"
import { goTo, installBridge, setup, signIn } from "./helpers"
import * as care from "../../src/state/careLogic"

describe("App in a plain browser (no Electron bridge)", () => {
  test("landing -> sign in -> dashboard", async () => {
    const { user } = setup()
    expect(screen.getByText(/one calm workspace/i)).toBeInTheDocument()
    await signIn(user)
    expect(screen.getAllByText(/Jane Roe/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Browser preview — changes are not saved/)).toBeInTheDocument()
  })

  test("sign-in form validates required fields", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: /sign in to your workspace/i }))
    await user.click(screen.getByRole("button", { name: /sign in$/i }))
    expect(screen.getByText("Email is required.")).toBeInTheDocument()
    expect(screen.getByText("Password is required.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /sign up for free/i }))
    expect(screen.getByRole("heading", { name: /create/i })).toBeInTheDocument()
  })

  test("in-app menu bar is shown in the browser and Ctrl+number navigates", async () => {
    const { user } = setup()
    await signIn(user)
    expect(screen.getByRole("menubar", { name: /application menu/i })).toBeInTheDocument()
    await user.keyboard("{Control>}2{/Control}")
    expect(await screen.findByRole("heading", { name: /manage medications/i })).toBeInTheDocument()
    await user.keyboard("{Control>}3{/Control}")
    expect(screen.getByRole("heading", { name: /manage appointments/i })).toBeInTheDocument()
    await user.keyboard("{Control>}s{/Control}")
    expect(screen.getByText(/Browser preview: changes are kept/)).toBeInTheDocument()
  })

  test("theme preference is remembered", async () => {
    localStorage.setItem("cc-theme", "dark")
    setup()
    expect(document.documentElement).toHaveClass("dark")
  })
})

describe("App inside Electron (preload bridge present)", () => {
  test("hides the in-app menu bar because the native menu replaces it", async () => {
    installBridge()
    const { user } = setup()
    await signIn(user)
    expect(screen.queryByRole("menubar")).not.toBeInTheDocument()
    expect(screen.getByText("All changes saved")).toBeInTheDocument()
  })

  test("reports the session to the main process for the menu and tray", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await waitFor(() => expect(bridge.setSession).toHaveBeenCalledWith(expect.objectContaining({ signedIn: false })))
    await signIn(user)
    await waitFor(() =>
      expect(bridge.setSession).toHaveBeenLastCalledWith(
        expect.objectContaining({ signedIn: true, userName: "Jane Roe", nextMedication: expect.stringMatching(/ at /) }),
      ),
    )
  })

  test("native menu commands drive navigation, dialogs and zoom", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("messages")
    expect(await screen.findByRole("button", { name: /compose new message/i })).toBeInTheDocument()
    bridge.emitMenu("appointments")
    expect(screen.getByRole("heading", { name: /manage appointments/i })).toBeInTheDocument()
    bridge.emitMenu("shortcuts")
    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    bridge.emitMenu("settings")
    expect(screen.getByRole("dialog", { name: /settings/i })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    bridge.emitMenu("zoomIn")
    expect(screen.getByText(/Zoom 110%/)).toBeInTheDocument()
    bridge.emitMenu("zoomOut")
    bridge.emitMenu("zoomReset")
    expect(screen.getByText(/Zoom 100%/)).toBeInTheDocument()
    bridge.emitMenu("search")
    expect(screen.getByRole("search")).toBeInTheDocument()
    bridge.emitMenu("emergency")
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  test("Ctrl shortcuts owned by the native menu are not handled twice", async () => {
    installBridge()
    const { user } = setup()
    await signIn(user)
    await user.keyboard("{Control>}2{/Control}")
    expect(screen.queryByRole("heading", { name: /manage medications/i })).not.toBeInTheDocument()
  })

  test("left-hand mode and high contrast toggle from the View menu", async () => {
    const bridge = installBridge()
    const { user, container } = setup()
    await signIn(user)
    bridge.emitMenu("toggleHandMode")
    expect(container.querySelector(".desktop-window")).toHaveClass("hand-left")
    expect(document.body).toHaveClass("one-handed-left")
    bridge.emitMenu("toggleHandMode")
    expect(container.querySelector(".desktop-window")).not.toHaveClass("hand-left")
    bridge.emitMenu("highContrast")
    expect(document.documentElement).toHaveClass("high-contrast")
  })

  test("changes are autosaved to disk through the bridge", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("checkin")
    await waitFor(() => expect(bridge.saveCareData).toHaveBeenCalled(), { timeout: 2000 })
    const saved = bridge.saveCareData.mock.calls.at(-1)![0] as care.CareData
    expect(saved.checkedIn).toBe(true)
    expect(saved.ownerName).toBe("Jane Roe")
    expect(bridge.notify).toHaveBeenCalledWith("Check-in recorded", expect.stringContaining("check-in was logged"))
    expect(await screen.findByText("All changes saved")).toBeInTheDocument()
  })

  test("File > Save reports success or failure", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("save")
    expect(await screen.findByText("Care plan saved to this computer")).toBeInTheDocument()
    bridge.saveCareData.mockResolvedValueOnce({ ok: false, error: "disk full" })
    bridge.emitMenu("save")
    expect(await screen.findByText("Save failed: disk full")).toBeInTheDocument()
  })

  test("saved care data is loaded from disk at startup", async () => {
    const stored = care.toCareData(
      care.addMedication(care.createInitialState(), { name: "Vitamin D", dose: "1000 IU", time: "09:00", notes: "" }),
      "Jane Roe",
    )
    installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: true, data: stored }) })
    const { user } = setup()
    await signIn(user)
    await goTo(user, "Medications")
    expect(await screen.findByText("Vitamin D")).toBeInTheDocument()
  })

  test("a damaged or unreadable save file is reported, not fatal", async () => {
    installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: true, data: { version: 9 } }) })
    const { user } = setup()
    await signIn(user)
    expect(await screen.findByText(/could not be read; starting from sample data/)).toBeInTheDocument()
  })

  test("load errors are reported", async () => {
    installBridge({ loadCareData: jest.fn().mockResolvedValue({ ok: false, error: "locked" }) })
    const { user } = setup()
    await signIn(user)
    expect(await screen.findByText("Could not open saved care plan: locked")).toBeInTheDocument()
  })

  test("load exceptions are reported", async () => {
    installBridge({ loadCareData: jest.fn().mockRejectedValue(new Error("ipc down")) })
    const { user } = setup()
    await signIn(user)
    expect(await screen.findByText("Could not open saved care plan")).toBeInTheDocument()
  })

  test("File > Export writes through the native save dialog", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("export")
    expect(await screen.findByText("Care plan exported to plan.json")).toBeInTheDocument()
    expect(bridge.exportCareData).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }))
    bridge.exportCareData.mockResolvedValueOnce({ ok: false, error: "denied" })
    bridge.emitMenu("export")
    expect(await screen.findByText("Export failed: denied")).toBeInTheDocument()
  })

  test("File > Import replaces the care plan with a valid file", async () => {
    const imported = care.toCareData(
      care.addAppointment(care.createInitialState(), { title: "Hearing test", dateTime: "Monday — 10:00 am", location: "Clinic", notes: "" }),
      "Someone Else",
    )
    const bridge = installBridge({ importCareData: jest.fn().mockResolvedValue({ ok: true, data: imported, filePath: "/tmp/in.json" }) })
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("import")
    expect(await screen.findByText("Imported care plan from in.json")).toBeInTheDocument()
    bridge.emitMenu("appointments")
    expect(screen.getByText("Hearing test")).toBeInTheDocument()
  })

  test("File > Import rejects files that are not care plans", async () => {
    const bridge = installBridge({ importCareData: jest.fn().mockResolvedValue({ ok: true, data: { hello: 1 }, filePath: "C:\\x\\notes.json" }) })
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("import")
    expect(await screen.findByText("Import failed: notes.json is not a CareConnect care plan")).toBeInTheDocument()
    bridge.importCareData.mockResolvedValueOnce({ ok: false, error: "too big" })
    bridge.emitMenu("import")
    expect(await screen.findByText("Import failed: too big")).toBeInTheDocument()
  })

  test("File > Sign out returns to the landing page", async () => {
    const bridge = installBridge()
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("signout")
    expect(await screen.findByText(/one calm workspace/i)).toBeInTheDocument()
    // The decorative in-app menu bar is hidden on the landing page in Electron.
    expect(document.querySelector(".welcome-menubar")).toBeNull()
  })

  test("print uses the browser print dialog", async () => {
    const bridge = installBridge()
    const print = jest.spyOn(window, "print").mockImplementation(() => undefined)
    const { user } = setup()
    await signIn(user)
    bridge.emitMenu("print")
    expect(print).toHaveBeenCalled()
  })

  test("menu commands stop after the shell unmounts", async () => {
    const bridge = installBridge()
    const { user, unmount } = setup()
    await signIn(user)
    unmount()
    act(() => bridge.emitMenu("messages"))
    expect(within(document.body).queryByRole("navigation")).toBeNull()
  })
})
