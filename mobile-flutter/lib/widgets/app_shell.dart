import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import 'cards.dart';
import 'settings_drawer.dart';
import 'tap_button.dart';

/// The five top-level destinations, each backed by a named route.
///
/// Navigation is driven by the Flutter `Navigator` (see `main.dart`'s
/// `_onGenerateRoute`), not by a field on `AppState` -- this enum only says
/// which tab is *currently showing* so the nav bar/sidebar can highlight it
/// and the header can label it.
enum AppTab { dashboard, medications, appointments, activity, messages }

extension AppTabRoute on AppTab {
  String get route => switch (this) {
    AppTab.dashboard => '/dashboard',
    AppTab.medications => '/medications',
    AppTab.appointments => '/appointments',
    AppTab.activity => '/activity',
    AppTab.messages => '/messages',
  };
}

/// Navigation items -- mirror the Figma design's NAV_ITEMS.
class _NavItem {
  const _NavItem(this.tab, this.label, this.icon);
  final AppTab tab;
  final String label;
  final IconData icon;
}

const _navItems = [
  _NavItem(AppTab.dashboard, 'Dashboard', Icons.dashboard_outlined),
  _NavItem(AppTab.medications, 'Medications', Icons.medication_outlined),
  _NavItem(AppTab.appointments, 'Appointments', Icons.event_outlined),
  _NavItem(AppTab.activity, 'Activity', Icons.insights_outlined),
  _NavItem(AppTab.messages, 'Messages', Icons.mail_outline),
];

/// The authenticated app shell: header, greeting bar, navigation (bottom bar
/// on phones / sidebar on tablets), SOS emergency button, and the settings
/// drawer with One-Handed Mode.
///
/// Left-Hand Mode (the team's assigned accessibility constraint):
/// - Bottom nav anchors to the LEFT edge so items fall in the left thumb zone.
/// - The SOS button moves to the bottom-LEFT corner.
/// - The sidebar renders on the LEFT side on tablets.
/// - The header's settings/sign-out icons move to the LEFT edge (with the
///   logo pushed to the right) instead of their default right-edge spot.
class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.state,
    required this.child,
    required this.activeTab,
  });

  final AppState state;
  final Widget child;
  final AppTab activeTab;

  @override
  Widget build(BuildContext context) {
    // Rebuild on state changes (hand mode, theme, unread count, etc.) so
    // the shell stays correct even when it isn't being rebuilt by an
    // ancestor listening to [state] -- see the same pattern in
    // message_detail_screen.dart and the screens under lib/screens/.
    // AppShell is built inline inside main.dart's _onGenerateRoute, as part
    // of an already-pushed route, so it needs this just as much as those
    // screens do: without it, e.g. picking a new One-Handed Mode from the
    // settings sheet (a *different*, newly-pushed route) updated AppState
    // but never made the shell underneath re-render with the new layout.
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) => _buildShell(context),
    );
  }

  Widget _buildShell(BuildContext context) {
    final isWide = MediaQuery.sizeOf(context).width >= 768;
    return isWide ? _buildWide(context) : _buildCompact(context);
  }

  // -- Phone layout ----------------------------------------------------------
  Widget _buildCompact(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final handLeft = state.handMode == HandMode.left;

    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: Column(
        children: [
          // Without this, the header (logo, settings, sign-out) renders
          // starting at the very top of the screen and gets pushed under
          // the status bar / notch on real devices, making those icons
          // untappable. The bottom nav below already handles its own edge
          // with SafeArea(top: false); this is the matching top edge.
          SafeArea(bottom: false, child: _Header(state: state, activeTab: activeTab)),
          Expanded(child: child),
        ],
      ),
      // Bottom nav -- anchored LEFT in Left-Hand Mode.
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: scheme.surface,
          border: Border(top: BorderSide(color: scheme.outline)),
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 68,
            child: Row(
              // Key accessibility behavior: in Left-Hand Mode the nav
              // cluster hugs the left edge (left thumb zone); default is
              // evenly spread; Right mode hugs the right edge.
              mainAxisAlignment: switch (state.handMode) {
                HandMode.left => MainAxisAlignment.start,
                HandMode.right => MainAxisAlignment.end,
                HandMode.off => MainAxisAlignment.spaceEvenly,
              },
              children: [
                for (final item in _navItems)
                  _NavButton(
                    item: item,
                    active: activeTab == item.tab,
                    badgeCount: item.tab == AppTab.messages ? state.unreadMessageCount : 0,
                    onTap: () => Navigator.of(context).pushReplacementNamed(item.tab.route),
                  ),
              ],
            ),
          ),
        ),
      ),
      // SOS floats above the bottom nav, on the LEFT in Left-Hand Mode.
      floatingActionButton: const _SosFab(),
      floatingActionButtonLocation: handLeft
          ? FloatingActionButtonLocation.startFloat
          : FloatingActionButtonLocation.endFloat,
    );
  }

  // -- Tablet layout -----------------------------------------------------------
  Widget _buildWide(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final handRight = state.handMode == HandMode.right;

    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: Column(
        children: [
          SafeArea(bottom: false, child: _Header(state: state, activeTab: activeTab)),
          Expanded(
            child: Row(
              children: [
                // Sidebar sits on the LEFT by default; Right mode flips it.
                if (!handRight) _Sidebar(state: state, activeTab: activeTab),
                Expanded(child: child),
                if (handRight) _Sidebar(state: state, activeTab: activeTab),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: const _SosFab(),
      floatingActionButtonLocation: state.handMode == HandMode.left
          ? FloatingActionButtonLocation.startFloat
          : FloatingActionButtonLocation.endFloat,
    );
  }
}

// -- Header + greeting bar ----------------------------------------------------

class _Header extends StatelessWidget {
  const _Header({required this.state, required this.activeTab});

  final AppState state;
  final AppTab activeTab;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final hour = now.hour;
    final timeStr =
        '${(hour % 12) == 0 ? 12 : hour % 12}:${now.minute.toString().padLeft(2, '0')} ${hour < 12 ? 'am' : 'pm'}';
    final dateStr = '${_weekday(now.weekday)}, ${now.day} ${_month(now.month)}';
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
        ? 'Good afternoon'
        : 'Good evening';
    final pageLabel = _navItems
        .where((n) => n.tab == activeTab)
        .map((n) => n.label)
        .followedBy(const [''])
        .first;

    return Material(
      color: scheme.surface,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Builder(
              builder: (context) {
                const logo = CCLogo(size: 28);
                final icons = [
                  _HeaderIconBtn(
                    icon: Icons.settings_outlined,
                    tooltip: 'Open settings',
                    onTap: () => showSettingsSheet(context, state),
                  ),
                  const SizedBox(width: 8),
                  _HeaderIconBtn(
                    icon: Icons.logout,
                    tooltip: 'Sign out',
                    onTap: () {
                      state.signOut();
                      Navigator.of(context).pushNamedAndRemoveUntil('/landing', (route) => false);
                    },
                  ),
                ];
                // Left-Hand Mode: settings/sign-out move to the left edge
                // (the left thumb zone), with the logo pushed to the right.
                // Off/Right keep the original layout (icons on the right).
                return Row(
                  children: state.handMode == HandMode.left
                      ? [...icons, const Spacer(), logo]
                      : [logo, const Spacer(), ...icons],
                );
              },
            ),
          ),
          Divider(height: 1, color: scheme.outline),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Flexible(
                      child: Text(
                        dateStr,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(timeStr, style: TextStyle(color: scheme.primary, fontSize: 18, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '$greeting, ${state.userName} · $pageLabel',
                  style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                ),
                Text(
                  "Viewing Margaret's care plan",
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.primary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static String _weekday(int i) => const [
    '', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ][i];
  static String _month(int i) => const [
    '', 'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December',
  ][i];
}

class _HeaderIconBtn extends StatelessWidget {
  const _HeaderIconBtn({required this.icon, required this.tooltip, required this.onTap});

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 48,
      height: 48,
      child: IconButton(
        icon: Icon(icon, size: 22),
        tooltip: tooltip,
        onPressed: onTap,
        style: IconButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: CCTokens.borderRadius,
            side: BorderSide(color: Theme.of(context).colorScheme.outline, width: 2),
          ),
        ),
      ),
    );
  }
}

// -- Navigation widgets ---------------------------------------------------------

class _NavButton extends StatelessWidget {
  const _NavButton({required this.item, required this.active, required this.onTap, this.badgeCount = 0});

  final _NavItem item;
  final bool active;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final label = badgeCount > 0 ? '${item.label}, $badgeCount unread' : item.label;
    return Semantics(
      selected: active,
      button: true,
      label: label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            // maxWidth caps how wide a single item can grow -- without it,
            // a long label (e.g. "Appointments") at a larger text-size
            // setting kept growing the item's intrinsic width with no
            // limit, so the 5-item row eventually ran wider than the
            // screen and the last item (Messages) got clipped off the
            // right edge entirely. The label below still ellipsizes if it
            // doesn't fit inside this cap, so it degrades gracefully
            // instead of overflowing.
            constraints: const BoxConstraints(minWidth: 64, maxWidth: 78, minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Icon(
                      item.icon,
                      size: 22,
                      color: active ? scheme.primary : scheme.onSurfaceVariant,
                    ),
                    if (badgeCount > 0)
                      Positioned(
                        top: -4,
                        right: -6,
                        child: _NavBadge(count: badgeCount),
                      ),
                  ],
                ),
                const SizedBox(height: 2),
                SizedBox(
                  width: double.infinity,
                  child: Text(
                    item.label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: active ? scheme.primary : scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Sidebar extends StatelessWidget {
  const _Sidebar({required this.state, required this.activeTab});

  final AppState state;
  final AppTab activeTab;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      width: 208,
      child: Material(
        color: scheme.surface,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                children: [
                  for (final item in _navItems)
                    _SideNavBtn(
                      item: item,
                      active: activeTab == item.tab,
                      badgeCount: item.tab == AppTab.messages ? state.unreadMessageCount : 0,
                      onTap: () => Navigator.of(context).pushReplacementNamed(item.tab.route),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SideNavBtn extends StatelessWidget {
  const _SideNavBtn({required this.item, required this.active, required this.onTap, this.badgeCount = 0});

  final _NavItem item;
  final bool active;
  final VoidCallback onTap;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final label = badgeCount > 0 ? '${item.label}, $badgeCount unread' : item.label;
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: active ? scheme.surfaceContainerHighest : null,
        borderRadius: CCTokens.borderRadius,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: CCTokens.borderRadius,
          child: Semantics(
            selected: active,
            button: true,
            label: label,
            child: Container(
              constraints: const BoxConstraints(minHeight: 52),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Icon(
                        item.icon,
                        size: 20,
                        color: active ? scheme.primary : scheme.onSurfaceVariant,
                      ),
                      if (badgeCount > 0)
                        Positioned(
                          top: -4,
                          right: -6,
                          child: _NavBadge(count: badgeCount),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                        color: active ? scheme.primary : scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Small red unread-count pill overlaid on a nav icon. Only ever rendered
/// once per nav item (on the icon) -- the label text next to it never
/// duplicates the count, so there's exactly one badge per unread state.
class _NavBadge extends StatelessWidget {
  const _NavBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
      decoration: BoxDecoration(
        color: Colors.red.shade600,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white, width: 1),
      ),
      alignment: Alignment.center,
      child: Text(
        count > 9 ? '9+' : '$count',
        textAlign: TextAlign.center,
        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700, height: 1),
      ),
    );
  }
}

// -- SOS -------------------------------------------------------------------------

class _SosFab extends StatelessWidget {
  const _SosFab();

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.extended(
      backgroundColor: Colors.red.shade700,
      foregroundColor: Colors.white,
      extendedPadding: const EdgeInsets.symmetric(horizontal: 18),
      onPressed: () => _showSosDialog(context),
      icon: const Icon(Icons.emergency, size: 20),
      label: const Text(
        'SOS',
        style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 1.2),
      ),
    );
  }

  void _showSosDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          contentPadding: EdgeInsets.zero,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
                decoration: BoxDecoration(
                  color: Colors.red.shade700,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.emergency, size: 48, color: Colors.white),
                    const SizedBox(height: 10),
                    const Text(
                      'Emergency',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Press the button below to call emergency services immediately.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Colors.red.shade100),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    TapButton(
                      label: 'SOS Emergency Call',
                      variant: TapButtonVariant.destructive,
                      size: TapButtonSize.lg,
                      fullWidth: true,
                      icon: Icons.phone,
                      onPressed: () {
                        // A real tel: link, per the design system's SOS
                        // confirmation spec (Assignment 3 §3.3). On a device
                        // with a dialer this opens the phone app pre-filled
                        // with 911; on desktop/web it is a no-op, so the
                        // dialog still closes either way.
                        launchUrl(Uri(scheme: 'tel', path: '911'));
                        Navigator.of(ctx).pop();
                      },
                    ),
                    const SizedBox(height: 12),
                    TapButton(
                      label: 'Cancel',
                      variant: TapButtonVariant.ghost,
                      size: TapButtonSize.md,
                      fullWidth: true,
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
