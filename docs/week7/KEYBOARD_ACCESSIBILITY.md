# Keyboard shortcuts and desktop accessibility

The Week 7 prototype is designed to work without a pointer. This is implementation documentation, not a claim that a full screen-reader audit has been completed.

## Shortcut reference

Use **Ctrl** on Windows/Linux and **Command** on macOS unless stated otherwise.

| Shortcut | Action |
| --- | --- |
| Tab / Shift+Tab | Move between focusable controls. |
| Alt+F / Alt+E / Alt+V / Alt+H | Open File, Edit, View, or Help menu on Windows/Linux. |
| Arrow keys / Home / End | Move within an open menu. |
| Enter / Space | Open a focused menu or activate a focused control. |
| Escape | Close an open menu, search, context menu, or dialog. |
| Ctrl/Command+1…5 | Overview, Medications, Appointments, Activity, Messages. |
| Ctrl/Command+F | Focus CareConnect search. |
| Ctrl/Command+, | Open Settings. |
| Ctrl/Command+= / - / 0 | Zoom in, out, or reset. |
| Ctrl/Command+N | Open Messages and locate New Message. |
| F1 | Open the shortcut reference. |
| Ctrl/Command+S | Save the current workspace section on this device. Care data itself remains temporary. |

The menu and toolbar expose the same core actions as shortcuts; shortcut discovery is in Help → Keyboard shortcuts. The Electron title bar has keyboard-focusable minimize, maximize/restore, and close buttons. The smoke run verified Ctrl+2, Ctrl+5, Ctrl+S, F1, Alt+H, Help menu access, high contrast, and theme selection.

## Accessibility design considerations

- **Focus and navigation:** visible focus outlines, a skip-to-main-content link, labelled navigation landmarks, current-page state, and a focus trap in modal dialogs.
- **Names and roles:** buttons have text or accessible names; the menu bar, menus, toolbar, search results, dialogs, and status region have programmatic labels/roles.
- **Reading and contrast:** light/dark palettes, high-contrast setting, forced-colors styles, enlarged text, 80–200% zoom, and a compact layout at narrow effective width. Color is paired with labels/icons for important status.
- **Motion:** reduced-motion preference is respected in the CSS.
- **Forms and feedback:** sign-in form has explicit labels, required/error text, and a demo-password notice. Search and status changes use live regions where implemented.
- **Safety:** only the selected workspace view and theme are stored locally; clinical-looking demo data is not persisted. Sync, messaging, and emergency calling are not live. Sample information must not be used to make care decisions.

## Manual validation still recommended

Before claiming screen-reader support, a teammate should run Windows NVDA through welcome → demo sign-in → each navigation section → search → Settings → shortcuts and record labels, reading order, dialog focus return, and any defects. On macOS, repeat with VoiceOver when a Mac is available. Check keyboard-only access at 200% zoom and Windows High Contrast/forced-colors. These checks are recommended follow-up, not represented as completed test evidence in this Week 7 package.
