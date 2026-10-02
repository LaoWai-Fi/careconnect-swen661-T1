import * as care from "../../src/state/careLogic"
import {
  DEFAULT_APPTS,
  DEFAULT_MEDS,
  DEFAULT_MESSAGES,
  DEMO_USER_PLACEHOLDER,
  formatDay,
} from "../../src/state/seed"
import type { AppState } from "../../src/types"

const NOON = new Date("2026-10-02T12:00:00")

function fresh(): AppState {
  return care.createInitialState()
}

describe("names", () => {
  test("toDisplayName turns usernames and emails into readable names", () => {
    expect(care.toDisplayName("jane.roe")).toBe("Jane Roe")
    expect(care.toDisplayName("jane_roe-smith")).toBe("Jane Roe Smith")
    expect(care.toDisplayName("jane.roe@example.com")).toBe("Jane Roe")
    expect(care.toDisplayName("  Jane Roe  ")).toBe("Jane Roe")
    expect(care.toDisplayName("...")).toBe("Caregiver")
  })

  test("firstNameOf and initialsOf", () => {
    expect(care.firstNameOf(" Jane Roe")).toBe("Jane")
    expect(care.initialsOf("jane roe smith")).toBe("JR")
    expect(care.initialsOf("")).toBe("")
  })

  test("relabelUser moves seed records from the placeholder to the signed-in user", () => {
    const s = fresh()
    const relabeled = care.relabelUser(s, DEMO_USER_PLACEHOLDER, "Jane Roe")
    const assignees = relabeled.appointments.map((a) => a.assignee)
    expect(assignees).not.toContain(DEMO_USER_PLACEHOLDER)
    expect(assignees).toContain("Jane Roe")
    const toMe = relabeled.messages.filter((m) => m.to.includes("Jane Roe"))
    expect(toMe.length).toBeGreaterThan(0)
    expect(toMe.some((m) => m.body.includes("Hi Jane"))).toBe(true)
  })

  test("relabelUser is a no-op when the names match", () => {
    const s = fresh()
    const same = care.relabelUser(s, "A", "A")
    expect(same.appointments).toBe(s.appointments)
    expect(same.messages).toBe(s.messages)
  })
})

describe("session and navigation", () => {
  test("signIn sets the user, relabels data and opens the dashboard", () => {
    const s = care.signIn(fresh(), "jane.roe")
    expect(s.userName).toBe("Jane Roe")
    expect(s.page).toBe("dashboard")
  })

  test("signOut returns to the landing page", () => {
    const s = care.signOut({ ...care.signIn(fresh(), "x"), viewingMessageId: "m1" })
    expect(s.page).toBe("landing")
    expect(s.userName).toBe("")
    expect(s.viewingMessageId).toBeNull()
  })

  test("navigateTo clears the open message unless staying on messages", () => {
    const viewing = care.viewMessage(fresh(), "msg-1")
    expect(viewing.page).toBe("messages")
    expect(care.navigateTo(viewing, "messages").viewingMessageId).toBe("msg-1")
    expect(care.navigateTo(viewing, "medications").viewingMessageId).toBeNull()
  })
})

describe("messages", () => {
  const id = DEFAULT_MESSAGES[0].id

  test("read, unread, archive, unarchive and delete", () => {
    let s = fresh()
    s = care.markMessageRead(s, id)
    expect(s.messages[0].read).toBe(true)
    s = care.toggleMessageRead(s, id)
    expect(s.messages[0].read).toBe(false)
    s = care.archiveMessage(s, id)
    expect(s.messages[0].archived).toBe(true)
    s = care.unarchiveMessage(s, id)
    expect(s.messages[0].archived).toBe(false)
    s = care.deleteMessage(s, id)
    expect(s.messages.find((m) => m.id === id)).toBeUndefined()
  })

  test("sendMessage adds a read message at the top with a timestamp", () => {
    const s = care.sendMessage(fresh(), { from: "Jane", to: ["Dr. Sharma"], subject: "Hi", body: "Hello" }, NOON)
    expect(s.messages[0]).toMatchObject({ subject: "Hi", read: true, archived: false, timestamp: "12:00 PM" })
    expect(s.messages).toHaveLength(DEFAULT_MESSAGES.length + 1)
  })

  test("unreadCount ignores archived messages", () => {
    const s = fresh()
    const unread = s.messages.filter((m) => !m.read && !m.archived).length
    expect(care.unreadCount(s)).toBe(unread)
    const firstUnread = s.messages.find((m) => !m.read)!
    expect(care.unreadCount(care.archiveMessage(s, firstUnread.id))).toBe(unread - 1)
  })
})

describe("medications", () => {
  test("addMedication appends it untaken and logs activity", () => {
    const s = care.addMedication(fresh(), { name: "Aspirin", dose: "75 mg", time: "09:00", notes: "" }, NOON)
    expect(s.medications.at(-1)).toMatchObject({ name: "Aspirin", taken: false })
    expect(s.activity[0]).toMatchObject({ type: "task_completed", description: "Added Aspirin to Margaret's medications" })
  })

  test("toggleMedTaken flips the flag and logs both directions", () => {
    const med = DEFAULT_MEDS.find((m) => !m.taken)!
    let s = care.toggleMedTaken(fresh(), med.id, NOON)
    expect(s.medications.find((m) => m.id === med.id)!.taken).toBe(true)
    expect(s.activity[0].type).toBe("medication_taken")
    s = care.toggleMedTaken(s, med.id, NOON)
    expect(s.activity[0]).toMatchObject({ type: "medication_unmarked", description: `${med.name} unmarked` })
  })

  test("toggleMedTaken ignores unknown ids", () => {
    const s = fresh()
    expect(care.toggleMedTaken(s, "nope")).toBe(s)
  })

  test("deleteMedication and nextMedication", () => {
    const s = fresh()
    const next = care.nextMedication(s)!
    expect(next.taken).toBe(false)
    expect(care.deleteMedication(s, next.id).medications.find((m) => m.id === next.id)).toBeUndefined()
    const allTaken = { ...s, medications: s.medications.map((m) => ({ ...m, taken: true })) }
    expect(care.nextMedication(allTaken)).toBeUndefined()
  })
})

describe("appointments, activity and dashboard", () => {
  test("add, edit and delete appointments", () => {
    const data = { title: "Dentist", dateTime: "Friday — 9:00 am", location: "Main St", notes: "" }
    let s = care.addAppointment(fresh(), data)
    const added = s.appointments[0]
    expect(added.title).toBe("Dentist")
    s = care.editAppointment(s, added.id, { ...data, title: "Dentist (moved)" })
    expect(s.appointments[0].title).toBe("Dentist (moved)")
    s = care.deleteAppointment(s, added.id)
    expect(s.appointments).toHaveLength(DEFAULT_APPTS.length)
  })

  test("checkIn records the check-in once", () => {
    const s = care.checkIn(fresh(), NOON)
    expect(s.checkedIn).toBe(true)
    expect(s.activity[0]).toMatchObject({ type: "checked_in", timestamp: "12:00 PM" })
    expect(care.checkIn(s, NOON)).toBe(s)
  })

  test("undoCheckIn clears the check-in and logs it", () => {
    const s = care.undoCheckIn(care.checkIn(fresh(), NOON), NOON)
    expect(s.checkedIn).toBe(false)
    expect(s.activity.map((a) => a.type)).toEqual(["check_in_undone", "checked_in"])
    expect(care.undoCheckIn(s, NOON)).toBe(s)
  })

  test("addActivity and toggleWidget", () => {
    let s = care.addActivity(fresh(), { type: "task_completed", description: "Walk", timestamp: "9:00 AM" })
    expect(s.activity[0].description).toBe("Walk")
    const widget = s.dashboardWidgets[0]
    s = care.toggleWidget(s, widget.id)
    expect(s.dashboardWidgets[0].enabled).toBe(!widget.enabled)
  })

  test("uid values are unique", () => {
    const ids = new Set(Array.from({ length: 200 }, () => care.uid()))
    expect(ids.size).toBe(200)
  })
})

describe("persistence format", () => {
  test("toCareData -> parseCareData round trip", () => {
    const s = care.checkIn(care.signIn(fresh(), "jane.roe"))
    const data = care.toCareData(s, "Jane Roe")
    const parsed = care.parseCareData(JSON.parse(JSON.stringify(data)))
    expect(parsed).toEqual(data)
    const restored = care.applyCareData(fresh(), parsed!)
    expect(restored.checkedIn).toBe(true)
    expect(restored.activity).toEqual(s.activity)
    expect(restored.page).toBe("landing")
  })

  test("older files without ownerName fall back to the placeholder", () => {
    const data = care.toCareData(fresh(), "x") as Partial<care.CareData>
    delete data.ownerName
    expect(care.parseCareData(data)!.ownerName).toBe(DEMO_USER_PLACEHOLDER)
  })

  test.each([
    ["not an object", 5],
    ["array", []],
    ["wrong version", { version: 2 }],
    ["bad owner", { ownerName: 5 }],
    ["bad medications", { medications: [{ id: 1 }] }],
    ["bad appointments", { appointments: "x" }],
    ["bad activity type", { activity: [{ id: "a", type: "hack", description: "", timestamp: "" }] }],
    ["bad messages", { messages: [{ id: "m" }] }],
    ["bad widgets", { dashboardWidgets: [{ id: "w" }] }],
    ["bad checkedIn", { checkedIn: "yes" }],
    ["bad handMode", { handMode: "both" }],
    ["bad fontSize", { fontSize: "huge" }],
  ])("parseCareData rejects %s", (_name, patch) => {
    const base = care.toCareData(fresh(), "x")
    const input = typeof patch === "object" && !Array.isArray(patch) ? { ...base, ...patch } : patch
    expect(care.parseCareData(input)).toBeNull()
  })
})

describe("seed data", () => {
  test("formatDay skips weekends", () => {
    const friday = new Date("2026-10-02T09:00:00")
    expect(formatDay(1, friday)).toMatch(/^Monday/)
    expect(formatDay(0, friday)).toMatch(/^Friday/)
  })

  test("seed appointments use upcoming dates", () => {
    expect(DEFAULT_APPTS.every((a) => a.dateTime.includes("—"))).toBe(true)
  })
})
