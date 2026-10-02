import React, { useEffect, useRef, useState } from "react"
import Logo from "./Logo"
import TapButton from "./TapButton"
import { Input } from "./FormField"
import {
  ActivityIcon,
  CalendarIcon,
  CareIcon,
  ChevronDownIcon,
  DashboardIcon,
  EmergencyIcon,
  HelpIcon,
  MailIcon,
  MedicineIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SyncIcon,
} from "./icons"
import type { AppState, HandMode, Page } from "../types"
import { useFocusTrap } from "../useFocusTrap"
import { getDesktop } from "../lib/desktop"
import { initialsOf } from "../state/careLogic"

interface NavItem {
  id: Page
  label: string
  shortcut: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Overview",
    shortcut: "1",
    icon: <DashboardIcon />,
  },
  {
    id: "medications",
    label: "Medications",
    shortcut: "2",
    icon: <MedicineIcon />,
  },
  {
    id: "appointments",
    label: "Appointments",
    shortcut: "3",
    icon: <CalendarIcon />,
  },
  { id: "activity", label: "Activity", shortcut: "4", icon: <ActivityIcon /> },
  { id: "messages", label: "Messages", shortcut: "5", icon: <MailIcon /> },
]

const MENUS = {
  File: [
    { label: "Save care plan", shortcut: "⌘/Ctrl S", action: "save" },
    { label: "Print", shortcut: "⌘/Ctrl P", action: "print" },
    { label: "Settings", shortcut: "⌘/Ctrl ,", action: "settings" },
    { label: "Sign out", shortcut: "", action: "signout" },
  ],
  Edit: [
    { label: "Find in CareConnect", shortcut: "⌘/Ctrl F", action: "search" },
  ],
  View: [
    { label: "Overview", shortcut: "⌘/Ctrl 1", action: "dashboard" },
    { label: "Medications", shortcut: "⌘/Ctrl 2", action: "medications" },
    { label: "Appointments", shortcut: "⌘/Ctrl 3", action: "appointments" },
    { label: "Activity", shortcut: "⌘/Ctrl 4", action: "activity" },
    { label: "Messages", shortcut: "⌘/Ctrl 5", action: "messages" },
    { label: "Zoom in", shortcut: "⌘/Ctrl =", action: "zoomIn" },
    { label: "Zoom out", shortcut: "⌘/Ctrl -", action: "zoomOut" },
    { label: "Actual size", shortcut: "⌘/Ctrl 0", action: "zoomReset" },
  ],
  Help: [
    { label: "Keyboard shortcuts", shortcut: "F1", action: "shortcuts" },
    { label: "CareConnect help", shortcut: "", action: "help" },
  ],
} as const

const IS_MAC =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = IS_MAC ? "⌘" : "Ctrl+"
const modKey = (shortcut: string) => shortcut.replace("⌘/Ctrl ", MOD)
const ZOOM_STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2]

interface Props {
  state: AppState
  navigate: (p: Page) => void
  onHandMode: (m: HandMode) => void
  onFontSize: (s: "normal" | "large" | "xlarge") => void
  onTheme: (t: "light" | "dark" | "system") => void
  onSignOut: () => void
  /** Save care data now (Ctrl+S, toolbar save button). */
  onSave?: () => void
  /** Desktop only: export / import the care plan through native file dialogs. */
  onExport?: () => void
  onImport?: () => void
  onCheckIn?: () => void
  /** Latest status message from App (save results, import/export, errors). */
  notice?: { id: number; text: string } | null
  children: React.ReactNode
}

// Shortcuts that the native Electron menu owns. When the app runs inside
// Electron the menu accelerators fire these, so the renderer must not handle
// them a second time.
const NATIVE_MENU_KEYS = ["1", "2", "3", "4", "5", "=", "-", "0", ",", "f", "s", "n", "p", "e", "o", "l"]

export default function AppShell({
  state,
  navigate,
  onHandMode,
  onFontSize,
  onTheme,
  onSignOut,
  onSave,
  onExport,
  onImport,
  onCheckIn,
  notice,
  children,
}: Props) {
  const desktop = getDesktop()
  const [openMenu, setOpenMenu] = useState<keyof typeof MENUS | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] =
    useState<"general" | "accessibility" | "sync">("general")
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [highContrast, setHighContrast] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-contrast: more)").matches,
  )
  const [status, setStatus] = useState(
    desktop ? "All changes saved" : "Browser preview — changes are not saved",
  )
  const baseDpr = useRef(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
  )
  const [zoom, setZoom] = useState(100)
  const [appZoom, setAppZoom] = useState(1)
  const [accountOpen, setAccountOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const settingsRef = useFocusTrap(settingsOpen, () => setSettingsOpen(false))
  const shortcutsRef = useFocusTrap(shortcutsOpen, () =>
    setShortcutsOpen(false),
  )
  const sosRef = useFocusTrap(sosOpen, () => setSosOpen(false))

  const unreadMessages = state.messages.filter(
    (message) => !message.read && !message.archived,
  ).length
  const completedMeds = state.medications.filter(
    (medication) => medication.taken,
  ).length
  const currentLabel =
    NAV_ITEMS.find((item) => item.id === state.page)?.label ?? "CareConnect"
  const handLeft = state.handMode === "left"
  const userName = state.userName || "Caregiver"
  const firstName = userName.split(" ")[0]
  const initials = initialsOf(userName)
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast)
    return () => document.documentElement.classList.remove("high-contrast")
  }, [highContrast])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const command = event.ctrlKey || event.metaKey
      if (event.key === "Escape") {
        setOpenMenu(null)
        setContextMenu(null)
        setSearchOpen(false)
        setAccountOpen(false)
      }
      if (
        desktop &&
        (event.key === "F1" ||
          (command && NATIVE_MENU_KEYS.includes(event.key.toLowerCase())))
      )
        return
      if (event.key === "F1") {
        event.preventDefault()
        setShortcutsOpen(true)
      }
      if (command && ["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault()
        navigate(NAV_ITEMS[Number(event.key) - 1].id)
      }
      if (command && (event.key === "=" || event.key === "+")) {
        event.preventDefault()
        changeZoom(1)
      }
      if (command && (event.key === "-" || event.key === "_")) {
        event.preventDefault()
        changeZoom(-1)
      }
      if (command && event.key === "0") {
        event.preventDefault()
        changeZoom(0)
      }
      if (command && event.key === ",") {
        event.preventDefault()
        setSettingsOpen(true)
      }
      if (command && event.key.toLowerCase() === "f") {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => searchRef.current?.focus(), 0)
      }
      if (command && event.key.toLowerCase() === "s") {
        event.preventDefault()
        runActionRef.current("save")
      }
      if (command && event.key.toLowerCase() === "n") {
        event.preventDefault()
        navigate("messages")
        setStatus("Messages opened — choose New Message to compose")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate, desktop])

  // Status messages coming from App (autosave, import/export results).
  useEffect(() => {
    // Intentional: mirrors a one-shot message from App into the status bar text.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (notice) setStatus(notice.text)
  }, [notice])

  // Native menu and tray commands arrive from the main process over IPC.
  const runActionRef = useRef<(action: string) => void>(() => undefined)
  useEffect(() => {
    if (!desktop) return
    return desktop.onMenuCommand((action) => runActionRef.current(action))
  }, [desktop])

  useEffect(() => {
    if (!openMenu) return
    function closeMenus(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-desktop-menu]"))
        setOpenMenu(null)
    }
    window.addEventListener("mousedown", closeMenus)
    return () => window.removeEventListener("mousedown", closeMenus)
  }, [openMenu])

  useEffect(() => {
    function updateZoom() {
      setZoom(Math.round((window.devicePixelRatio / baseDpr.current) * 100))
    }
    window.addEventListener("resize", updateZoom)
    return () => window.removeEventListener("resize", updateZoom)
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    function closeAccount(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-account-menu]"))
        setAccountOpen(false)
    }
    window.addEventListener("mousedown", closeAccount)
    return () => window.removeEventListener("mousedown", closeAccount)
  }, [accountOpen])

  function changeZoom(direction: 1 | -1 | 0) {
    setAppZoom((current) => {
      if (direction === 0) return 1
      const index = ZOOM_STEPS.findIndex((step) => step >= current - 0.001)
      return ZOOM_STEPS[
        Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction))
      ]
    })
  }

  // App zoom scales the rem base (on top of the Text size setting) and switches
  // to the compact layout when the effective window width drops below 960px.
  useEffect(() => {
    const base =
      state.fontSize === "large" ? 19 : state.fontSize === "xlarge" ? 22 : 16
    document.documentElement.style.fontSize = base * appZoom + "px"
    function updateCompact() {
      const effectiveWidth = window.innerWidth / (appZoom * (base / 16))
      document.documentElement.classList.toggle(
        "app-compact",
        effectiveWidth < 960,
      )
    }
    updateCompact()
    window.addEventListener("resize", updateCompact)
    return () => window.removeEventListener("resize", updateCompact)
  }, [appZoom, state.fontSize])

  useEffect(
    () => () => {
      document.documentElement.classList.remove("app-compact")
    },
    [],
  )

  function handleMenuListKey(event: React.KeyboardEvent<HTMLElement>) {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[role='menuitem']"),
    )
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === "ArrowDown") {
      event.preventDefault()
      items[(index + 1) % items.length]?.focus()
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    }
    if (event.key === "Home") {
      event.preventDefault()
      items[0]?.focus()
    }
    if (event.key === "End") {
      event.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  function focusMenuButton(menu: string) {
    document
      .querySelector<HTMLElement>("[data-menu-name='" + menu + "'] > button")
      ?.focus()
  }

  const query = search.trim().toLowerCase()
  const searchResults = query
    ? [
        ...state.medications.map((m) => ({
          id: "med-" + m.id,
          label: m.name,
          detail: "Medication · " + m.time,
          page: "medications" as Page,
        })),
        ...state.appointments.map((a) => ({
          id: "appt-" + a.id,
          label: a.title,
          detail: "Appointment · " + a.dateTime,
          page: "appointments" as Page,
        })),
        ...state.messages
          .filter((m) => !m.archived)
          .map((m) => ({
            id: "msg-" + m.id,
            label: m.subject,
            detail: "Message · " + m.from,
            page: "messages" as Page,
          })),
      ]
        .filter((r) => (r.label + " " + r.detail).toLowerCase().includes(query))
        .slice(0, 8)
    : []

  function openResult(page: Page, label: string) {
    navigate(page)
    setSearchOpen(false)
    setSearch("")
    setStatus("Opened " + label)
  }

  function runAction(action: string) {
    setOpenMenu(null)
    if (NAV_ITEMS.some((item) => item.id === action)) navigate(action as Page)
    if (action === "compose") navigate("messages")
    if (action === "save") {
      if (onSave) onSave()
      else setStatus("Saved just now")
    }
    if (action === "export") onExport?.()
    if (action === "import") onImport?.()
    if (action === "checkin") onCheckIn?.()
    if (action === "toggleHandMode") onHandMode(handLeft ? "off" : "left")
    if (action === "highContrast") setHighContrast((value) => !value)
    if (action === "emergency") setSosOpen(true)
    if (action === "print") window.print()
    if (action === "signout") onSignOut()
    if (action === "settings") setSettingsOpen(true)
    if (action === "zoomIn") changeZoom(1)
    if (action === "zoomOut") changeZoom(-1)
    if (action === "zoomReset") changeZoom(0)
    if (action === "search") {
      setSearchOpen(true)
      window.setTimeout(() => searchRef.current?.focus(), 0)
    }
    if (action === "shortcuts" || action === "help") setShortcutsOpen(true)
  }
  runActionRef.current = runAction

  function handleMenuKey(event: React.KeyboardEvent, menu: keyof typeof MENUS) {
    const menuNames = Object.keys(MENUS) as (keyof typeof MENUS)[]
    const index = menuNames.indexOf(menu)
    if (event.key === "ArrowRight") {
      event.preventDefault()
      const next = menuNames[(index + 1) % menuNames.length]
      setOpenMenu(next)
      window.setTimeout(() => focusMenuButton(next), 0)
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      const previous =
        menuNames[(index - 1 + menuNames.length) % menuNames.length]
      setOpenMenu(previous)
      window.setTimeout(() => focusMenuButton(previous), 0)
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()
      setOpenMenu(menu)
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLElement>(
              "[data-open-menu] [role='menu'] [role='menuitem']",
            )
            ?.focus(),
        0,
      )
    }
  }

  return (
    <div
      className={`desktop-window ${
        handLeft ? "hand-left" : state.handMode === "right" ? "hand-right" : ""
      } bg-[var(--background)] text-[var(--foreground)]`}
      onContextMenu={(event) => {
        event.preventDefault()
        let x = event.clientX
        let y = event.clientY
        if (x === 0 && y === 0) {
          const rect = (event.target as HTMLElement).getBoundingClientRect()
          x = rect.left + 8
          y = rect.bottom
        }
        setContextMenu({
          x: Math.min(x, window.innerWidth - 256),
          y: Math.min(y, window.innerHeight - 150),
        })
        window.setTimeout(
          () =>
            document
              .querySelector<HTMLElement>(
                ".desktop-context-menu [role='menuitem']",
              )
              ?.focus(),
          0,
        )
      }}
      onClick={() => setContextMenu(null)}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="window-titlebar window-drag">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold text-sm">CareConnect</span>
          <span className="text-[var(--muted-foreground)] text-xs">
            Care workspace
          </span>
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Margaret Thompson · {currentLabel}
        </div>
        <div className="flex items-center gap-3">
          <div className="account-area window-no-drag" data-account-menu>
            <button
              type="button"
              className="account-button"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label={"Account menu, signed in as " + userName}
              title={"Signed in as " + userName}
              onClick={() => setAccountOpen(!accountOpen)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  setAccountOpen(true)
                  window.setTimeout(
                    () =>
                      document
                        .querySelector<HTMLElement>(
                          ".account-menu [role='menuitem']",
                        )
                        ?.focus(),
                    0,
                  )
                }
              }}
            >
              <span className="account-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="account-name">{userName}</span>
              <ChevronDownIcon />
            </button>
            {accountOpen && (
              <div
                className="account-menu"
                role="menu"
                aria-label="Account"
                onKeyDown={(event) => {
                  handleMenuListKey(event)
                  if (event.key === "Escape") {
                    event.stopPropagation()
                    setAccountOpen(false)
                    document
                      .querySelector<HTMLElement>(".account-button")
                      ?.focus()
                  }
                  if (event.key === "Tab") setAccountOpen(false)
                }}
              >
                <div className="account-menu-header">
                  <span
                    className="account-avatar account-avatar-lg"
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{userName}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Caregiver · Margaret Thompson&apos;s care team
                    </p>
                  </div>
                </div>
                <TapButton
                  size="xs"
                  variant="ghost"
                  role="menuitem"
                  className="desktop-menu-item"
                  onClick={() => {
                    setAccountOpen(false)
                    setSettingsOpen(true)
                  }}
                >
                  <span>Settings</span>
                  <kbd>{MOD},</kbd>
                </TapButton>
                <TapButton
                  size="xs"
                  variant="ghost"
                  role="menuitem"
                  className="desktop-menu-item"
                  onClick={() => {
                    setAccountOpen(false)
                    onSignOut()
                  }}
                >
                  <span>Sign out</span>
                </TapButton>
              </div>
            )}
          </div>
          {!desktop && (
            <div
              className="flex items-center gap-1 window-no-drag"
              aria-hidden="true"
            >
              <span className="window-control" />
              <span className="window-control" />
              <span className="window-control window-control-close" />
            </div>
          )}
        </div>
      </div>

      {/* Inside Electron the native File/Edit/View/Help menu replaces this
          in-app menu bar (see electron/menu.cjs). */}
      {!desktop && (
      <div
        className="desktop-menubar"
        role="menubar"
        aria-label="Application menu"
      >
        {(Object.keys(MENUS) as (keyof typeof MENUS)[]).map((menu) => (
          <div
            key={menu}
            className="relative"
            data-desktop-menu
            data-menu-name={menu}
            data-open-menu={openMenu === menu ? "" : undefined}
          >
            <TapButton
              size="xs"
              variant="ghost"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={openMenu === menu}
              onClick={(event) => {
                event.stopPropagation()
                setOpenMenu(openMenu === menu ? null : menu)
              }}
              onKeyDown={(event) => handleMenuKey(event, menu)}
              className="menubar-button"
            >
              {menu}
            </TapButton>
            {openMenu === menu && (
              <div
                className="desktop-menu-popover"
                role="menu"
                onKeyDown={(event) => {
                  handleMenuListKey(event)
                  if (event.key === "Escape") {
                    event.stopPropagation()
                    setOpenMenu(null)
                    focusMenuButton(menu)
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowLeft")
                    handleMenuKey(event, menu)
                  if (event.key === "Tab") setOpenMenu(null)
                }}
                aria-label={`${menu} menu`}
              >
                {MENUS[menu].map((item) => (
                  <TapButton
                    key={item.label}
                    data-action={item.action}
                    size="xs"
                    variant="ghost"
                    role="menuitem"
                    onClick={() => runAction(item.action)}
                    className="desktop-menu-item"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <kbd>{modKey(item.shortcut)}</kbd>}
                  </TapButton>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      <div
        className="desktop-toolbar"
        role="toolbar"
        aria-label="Primary actions"
      >
        <div className="flex items-center gap-1">
          <TapButton
            size="xs"
            variant="primary"
            onClick={() => navigate("messages")}
          >
            <PlusIcon /> New message
          </TapButton>
          <div className="toolbar-separator" />
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => navigate("medications")}
            aria-label="Open medications"
            title={"Medications (" + MOD + "2)"}
          >
            <MedicineIcon />
          </TapButton>
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => navigate("appointments")}
            aria-label="Open appointments"
            title={"Appointments (" + MOD + "3)"}
          >
            <CalendarIcon />
          </TapButton>
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => runAction("save")}
            aria-label="Save care plan"
            title={"Save care plan (" + MOD + "S)"}
          >
            <SyncIcon />
          </TapButton>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => {
              setSearchOpen(!searchOpen)
              window.setTimeout(() => searchRef.current?.focus(), 0)
            }}
            aria-label="Search CareConnect"
          >
            <SearchIcon /> <span className="hidden xl:inline">Find</span>{" "}
            <kbd>{MOD}F</kbd>
          </TapButton>
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title={"Settings (" + MOD + ",)"}
          >
            <SettingsIcon />
          </TapButton>
          <TapButton
            size="xs"
            variant="destructive"
            onClick={() => setSosOpen(true)}
          >
            <EmergencyIcon /> Emergency
          </TapButton>
        </div>
      </div>

      {searchOpen && (
        <div className="desktop-search" role="search">
          <SearchIcon />
          <Input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medications, appointments, messages…"
            aria-label="Search CareConnect"
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0])
                openResult(searchResults[0].page, searchResults[0].label)
            }}
            className="desktop-search-input"
          />
          <span className="text-xs text-[var(--muted-foreground)]">
            Esc to close
          </span>
          <p className="sr-only" aria-live="polite">
            {query ? searchResults.length + " results" : ""}
          </p>
          {query && (
            <div
              className="desktop-search-results"
              role="region"
              aria-label="Search results"
            >
              {searchResults.length === 0 ? (
                <p className="desktop-search-empty">
                  No matches for {search.trim()}
                </p>
              ) : (
                searchResults.map((result) => (
                  <TapButton
                    key={result.id}
                    size="xs"
                    variant="ghost"
                    onClick={() => openResult(result.page, result.label)}
                    className="desktop-search-result"
                  >
                    <span className="truncate">{result.label}</span>
                    <span className="desktop-search-detail">
                      {result.detail}
                    </span>
                  </TapButton>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="desktop-workspace">
        <aside className="desktop-sidebar" aria-label="CareConnect navigation">
          <div className="sidebar-profile">
            <div className="profile-avatar" aria-hidden="true">
              MT
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                Margaret Thompson
              </p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">
                Care recipient
              </p>
            </div>
            <ChevronDownIcon />
          </div>
          <nav className="flex-1 p-2" aria-label="Main navigation">
            <p className="sidebar-label">Workspace</p>
            {NAV_ITEMS.map((item) => (
              <TapButton
                key={item.id}
                size="xs"
                variant="ghost"
                onClick={() => navigate(item.id)}
                aria-current={state.page === item.id ? "page" : undefined}
                title={item.label}
                className={`sidebar-item ${
                  state.page === item.id ? "sidebar-item-active" : ""
                }`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {item.id === "messages" && unreadMessages > 0 ? (
                  <span
                    className="sidebar-badge"
                    aria-label={`${unreadMessages} unread`}
                  >
                    {unreadMessages}
                  </span>
                ) : (
                  <kbd className="sidebar-shortcut">
                    {MOD}
                    {item.shortcut}
                  </kbd>
                )}
              </TapButton>
            ))}
          </nav>
          <div className="sidebar-summary">
            <p className="sidebar-label">Today</p>
            <div className="summary-row">
              <span>Medications</span>
              <strong>
                {completedMeds}/{state.medications.length}
              </strong>
            </div>
            <div className="summary-row">
              <span>Next visit</span>
              <strong>10:30 am</strong>
            </div>
            <div className="summary-row">
              <span>Messages</span>
              <strong>{unreadMessages} unread</strong>
            </div>
          </div>
          <TapButton
            size="xs"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            className="sidebar-settings"
          >
            <SettingsIcon /> Settings <kbd className="ml-auto">{MOD},</kbd>
          </TapButton>
        </aside>

        <main id="main-content" className="desktop-content" tabIndex={-1}>
          <div className="content-titlebar">
            <div>
              <p className="text-lg font-bold">{currentLabel}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {greeting}, {firstName} · Viewing Margaret Thompson&apos;s care
                plan · {today}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="presence-dot" />{" "}
              {desktop ? "Saved on this computer" : "Browser preview"}
            </div>
          </div>
          <div className="desktop-content-scroll">{children}</div>
        </main>
      </div>

      <footer className="desktop-statusbar">
        <span className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="presence-dot" aria-hidden="true" /> {status}
        </span>
        <span className="ml-auto">
          {desktop ? "Stored locally" : "Not saved"}
        </span>
        <span>Zoom {Math.round(appZoom * zoom)}%</span>
        <span>{desktop ? "Desktop app" : "Browser"}</span>
      </footer>

      {contextMenu && (
        <div
          className="desktop-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          aria-label="Context menu"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={handleMenuListKey}
        >
          <TapButton
            size="xs"
            variant="ghost"
            role="menuitem"
            onClick={() => {
              setContextMenu(null)
              navigate("dashboard")
            }}
            className="desktop-menu-item"
          >
            Open overview <kbd>{MOD}1</kbd>
          </TapButton>
          <TapButton
            size="xs"
            variant="ghost"
            role="menuitem"
            onClick={() => {
              setContextMenu(null)
              setStatus("Care plan refreshed")
            }}
            className="desktop-menu-item"
          >
            Refresh care plan
          </TapButton>
          <TapButton
            size="xs"
            variant="ghost"
            role="menuitem"
            onClick={() => {
              setContextMenu(null)
              setSettingsOpen(true)
            }}
            className="desktop-menu-item"
          >
            Settings <kbd>{MOD},</kbd>
          </TapButton>
        </div>
      )}

      {settingsOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setSettingsOpen(false)}
        >
          <div
            ref={settingsRef}
            className="desktop-dialog settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-titlebar">
              <div>
                <p id="preferences-title" className="text-lg font-bold">
                  Settings
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Personalize your CareConnect workspace
                </p>
              </div>
              <TapButton
                size="xs"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                ×
              </TapButton>
            </div>
            <div className="settings-layout">
              <div className="settings-nav">
                <button
                  type="button"
                  className={
                    settingsSection === "general"
                      ? "settings-nav-active"
                      : undefined
                  }
                  aria-current={
                    settingsSection === "general" ? "true" : undefined
                  }
                  onClick={() => setSettingsSection("general")}
                >
                  <SettingsIcon /> General
                </button>
                <button
                  type="button"
                  className={
                    settingsSection === "accessibility"
                      ? "settings-nav-active"
                      : undefined
                  }
                  aria-current={
                    settingsSection === "accessibility" ? "true" : undefined
                  }
                  onClick={() => setSettingsSection("accessibility")}
                >
                  <CareIcon /> Accessibility
                </button>
                <button
                  type="button"
                  className={
                    settingsSection === "sync"
                      ? "settings-nav-active"
                      : undefined
                  }
                  aria-current={settingsSection === "sync" ? "true" : undefined}
                  onClick={() => setSettingsSection("sync")}
                >
                  <SyncIcon /> Data &amp; storage
                </button>
              </div>
              <div className="settings-content">
                {settingsSection === "general" && (
                  <>
                    <section aria-labelledby="appearance-title">
                      <p id="appearance-title" className="settings-heading">
                        Appearance
                      </p>
                      <p className="settings-description">
                        Choose the color theme used across the application.
                      </p>
                      <div
                        className="segmented-control"
                        role="group"
                        aria-label="Color theme"
                      >
                        {(["light", "system", "dark"] as const).map((theme) => (
                          <TapButton
                            key={theme}
                            size="xs"
                            variant={
                              state.theme === theme ? "primary" : "ghost"
                            }
                            onClick={() => onTheme(theme)}
                            aria-pressed={state.theme === theme}
                            className="capitalize flex-1"
                          >
                            {theme}
                          </TapButton>
                        ))}
                      </div>
                    </section>
                    <section aria-labelledby="text-size-title">
                      <p id="text-size-title" className="settings-heading">
                        Text size
                      </p>
                      <p className="settings-description">
                        Interface zoom remains usable from 80% to 200%.
                      </p>
                      <div
                        className="segmented-control"
                        role="group"
                        aria-label="Text size"
                      >
                        {(["normal", "large", "xlarge"] as const).map(
                          (size) => (
                            <TapButton
                              key={size}
                              size="xs"
                              variant={
                                state.fontSize === size ? "primary" : "ghost"
                              }
                              onClick={() => onFontSize(size)}
                              aria-pressed={state.fontSize === size}
                              className="capitalize flex-1"
                            >
                              {size === "xlarge" ? "Extra large" : size}
                            </TapButton>
                          ),
                        )}
                      </div>
                    </section>
                  </>
                )}
                {settingsSection === "accessibility" && (
                  <>
                    <section aria-labelledby="contrast-title">
                      <p id="contrast-title" className="settings-heading">
                        Accessibility
                      </p>
                      <div className="preference-row">
                        <div>
                          <p className="font-semibold text-sm">High contrast</p>
                          <p className="settings-description">
                            Increase borders and distinguish focused controls.
                          </p>
                        </div>
                        <TapButton
                          size="xs"
                          variant={highContrast ? "primary" : "outline"}
                          role="switch"
                          aria-checked={highContrast}
                          onClick={() => setHighContrast(!highContrast)}
                        >
                          {highContrast ? "On" : "Off"}
                        </TapButton>
                      </div>
                    </section>
                    <section aria-labelledby="handed-title">
                      <p id="handed-title" className="settings-heading">
                        Hand mode
                      </p>
                      <p className="settings-description">
                        Left-hand mode moves the Emergency, Find and Settings
                        controls to the left edge. Right-hand mode moves
                        navigation to the right edge.
                      </p>
                      <div
                        className="segmented-control"
                        role="group"
                        aria-label="Hand mode"
                      >
                        {(["off", "left", "right"] as HandMode[]).map(
                          (mode) => (
                            <TapButton
                              key={mode}
                              size="xs"
                              variant={
                                state.handMode === mode ? "primary" : "ghost"
                              }
                              onClick={() => onHandMode(mode)}
                              aria-pressed={state.handMode === mode}
                              className="capitalize flex-1"
                            >
                              {mode === "off"
                                ? "Standard"
                                : mode === "left"
                                  ? "Left-hand"
                                  : "Right-hand"}
                            </TapButton>
                          ),
                        )}
                      </div>
                    </section>
                  </>
                )}
                {settingsSection === "sync" && (
                  <section aria-labelledby="sync-title">
                    <p id="sync-title" className="settings-heading">
                      Data &amp; storage
                    </p>
                    <p className="settings-description">
                      {desktop
                        ? "CareConnect saves the care plan on this computer automatically. Use File > Export to move it to another computer."
                        : "The browser preview does not save changes."}
                    </p>
                    <div className="preference-row">
                      <div>
                        <p className="font-semibold text-sm">Save status</p>
                        <p className="settings-description">{status}</p>
                      </div>
                      <TapButton
                        size="xs"
                        variant="outline"
                        onClick={() => runAction("save")}
                      >
                        Save now
                      </TapButton>
                      {onExport && (
                        <TapButton size="xs" variant="outline" onClick={onExport}>
                          Export…
                        </TapButton>
                      )}
                      {onImport && (
                        <TapButton size="xs" variant="outline" onClick={onImport}>
                          Import…
                        </TapButton>
                      )}
                    </div>
                  </section>
                )}
              </div>
              <div className="dialog-footer">
                <TapButton
                  size="xs"
                  variant="ghost"
                  onClick={onSignOut}
                  className="mr-auto text-[var(--destructive)]"
                >
                  Sign out
                </TapButton>
                <TapButton
                  size="xs"
                  variant="primary"
                  onClick={() => setSettingsOpen(false)}
                >
                  Done
                </TapButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {shortcutsOpen && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={() => setShortcutsOpen(false)}
        >
          <div
            ref={shortcutsRef}
            className="desktop-dialog shortcuts-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-titlebar">
              <div>
                <p id="shortcuts-title" className="text-lg font-bold">
                  Keyboard shortcuts
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Use Ctrl on Windows/Linux and Cmd on macOS
                </p>
              </div>
              <TapButton
                size="xs"
                variant="ghost"
                onClick={() => setShortcutsOpen(false)}
                aria-label="Close keyboard shortcuts"
              >
                ×
              </TapButton>
            </div>
            <div className="shortcut-grid printable-reference">
              <div>
                <p className="settings-heading">Navigation</p>
                <Shortcut
                  label="Move focus forward / back"
                  keys="Tab / Shift+Tab"
                />
                <Shortcut label="Navigate menus" keys="Arrow keys" />
                <Shortcut
                  label="Overview through Messages"
                  keys="Ctrl/Cmd 1–5"
                />
                <Shortcut label="Close menu or dialog" keys="Esc" />
                {IS_MAC ? (
                  <Shortcut
                    label="Move to the menu bar"
                    keys="Ctrl+F2 (VoiceOver: VO+M)"
                  />
                ) : (
                  <Shortcut
                    label="Open File / Edit / View / Help menu"
                    keys="Alt+F / E / V / H"
                  />
                )}
              </div>
              <div>
                <p className="settings-heading">Actions</p>
                <Shortcut label="New message" keys="Ctrl/Cmd N" />
                <Shortcut label="Save care plan" keys="Ctrl/Cmd S" />
                <Shortcut label="Export care plan" keys="Ctrl/Cmd E" />
                <Shortcut label="Import care plan" keys="Ctrl/Cmd O" />
                <Shortcut label="Find" keys="Ctrl/Cmd F" />
                <Shortcut label="Settings" keys="Ctrl/Cmd ," />
              </div>
              <div>
                <p className="settings-heading">Reading & help</p>
                <Shortcut label="Print this reference" keys="Ctrl/Cmd P" />
                <Shortcut label="Help and shortcuts" keys="F1" />
                <Shortcut
                  label="Zoom in / out / actual size"
                  keys="Ctrl/Cmd = / - / 0"
                />
                <Shortcut label="Left-hand mode" keys="Ctrl/Cmd Shift L" />
                <Shortcut label="High contrast" keys="Ctrl/Cmd Shift H" />
              </div>
              <div className="screen-reader-note">
                <HelpIcon />
                <p>
                  Landmarks, live status updates, dialog names, and selected
                  navigation states are announced by NVDA and VoiceOver. Every
                  command is available without a pointer.
                </p>
              </div>
            </div>
            <div className="dialog-footer">
              <TapButton
                size="xs"
                variant="outline"
                onClick={() => {
                  document.documentElement.classList.add("print-reference")
                  window.print()
                  document.documentElement.classList.remove("print-reference")
                }}
              >
                Print reference
              </TapButton>
              <TapButton
                size="xs"
                variant="primary"
                onClick={() => setShortcutsOpen(false)}
              >
                Done
              </TapButton>
            </div>
          </div>
        </div>
      )}

      {sosOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div
            ref={sosRef}
            className="desktop-dialog emergency-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="emergency-title"
          >
            <div className="emergency-icon">
              <EmergencyIcon />
            </div>
            <p id="emergency-title" className="text-xl font-bold">
              Emergency assistance
            </p>
            <p className="text-sm text-[var(--muted-foreground)] text-center">
              CareConnect cannot place phone calls. If Margaret needs urgent
              help, call 911 from your phone now. Her care plan stays open here.
            </p>
            <div className="flex justify-end gap-2 w-full">
              <TapButton
                size="xs"
                variant="outline"
                onClick={() => setSosOpen(false)}
              >
                Cancel
              </TapButton>
              <TapButton
                size="xs"
                variant="destructive"
                onClick={() => {
                  setSosOpen(false)
                  setStatus("Emergency reminder shown: call 911 from your phone")
                }}
              >
                I understand
              </TapButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Shortcut({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="shortcut-row">
      <span>{label}</span>
      <kbd>{keys}</kbd>
    </div>
  )
}
