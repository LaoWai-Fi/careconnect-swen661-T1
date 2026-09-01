import 'package:flutter/material.dart';

import '../models/app_state.dart';
import '../theme/tokens.dart';
import 'cards.dart';
import 'tap_button.dart';

/// Navigation items — mirror the Figma design's NAV_ITEMS.
class _NavItem {
  const _NavItem(this.page, this.label, this.icon);
  final CCPage page;
  final String label;
  final IconData icon;
}

const _navItems = [
  _NavItem(CCPage.dashboard, 'Dashboard', Icons.dashboard_outlined),
  _NavItem(CCPage.medications, 'Medications', Icons.medication_outlined),
  _NavItem(CCPage.appointments, 'Appointments', Icons.event_outlined),
  _NavItem(CCPage.activity, 'Activity', Icons.insights_outlined),
];

/// The authenticated app shell: header, greeting bar, navigation (bottom bar
/// on phones / sidebar on tablets), SOS emergency button, and the settings
/// drawer with One-Handed Mode.
///
/// Left-Hand Mode (the team's assigned accessibility constraint):
/// - Bottom nav anchors to the LEFT edge so items fall in the left thumb zone.
/// - The SOS button moves to the bottom-LEFT corner.
/// - The sidebar renders on the LEFT side on tablets.
class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.state,
    required this.child,
    required this.onOpenSettings,
  });

  final AppState state;
  final Widget child;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.sizeOf(context).width >= 768;
    return isWide ? _buildWide(context) : _buildCompact(context);
  }

  // ── Phone layout ────────────────────────────────────────────────────────
  Widget _buildCompact(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final handLeft = state.handMode == HandMode.left;

    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: Column(
        children: [
          _Header(state: state, onOpenSettings: onOpenSettings),
          Expanded(child: child),
        ],
      ),
      // Bottom nav — anchored LEFT in Left-Hand Mode.
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
                    active: state.page == item.page,
                    onTap: () => state.navigate(item.page),
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

  // ── Tablet layout ───────────────────────────────────────────────────────
  Widget _buildWide(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final handRight = state.handMode == HandMode.right;

    return Scaffold(
      backgroundColor: scheme.surfaceContainerHighest,
      body: Column(
        children: [
          _Header(state: state, onOpenSettings: onOpenSettings),
          Expanded(
            child: Row(
              children: [
                // Sidebar sits on the LEFT by default; Right mode flips it.
                if (!handRight) _Sidebar(state: state),
                Expanded(child: child),
                if (handRight) _Sidebar(state: state),
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

// ── Header + greeting bar ──────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.state, required this.onOpenSettings});

  final AppState state;
  final VoidCallback onOpenSettings;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final hour = now.hour;
    final timeStr =
        '${(hour % 12) == 0 ? 12 : hour % 12}:${now.minute.toString().padLeft(2, '0')} ${hour < 12 ? 'am' : 'pm'}';
    final dateStr = _weekday(now.weekday) +
        ', ${now.day} ${_month(now.month)}';
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 17
        ? 'Good afternoon'
        : 'Good evening';
    final pageLabel = _navItems
        .where((n) => n.page == state.page)
        .map((n) => n.label)
        .followedBy(const [''])
        .first;

    return Material(
      color: scheme.surface,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                const CCLogo(size: 28),
                const Spacer(),
                _HeaderIconBtn(
                  icon: Icons.settings_outlined,
                  tooltip: 'Open settings',
                  onTap: onOpenSettings,
                ),
                const SizedBox(width: 8),
                _HeaderIconBtn(
                  icon: Icons.logout,
                  tooltip: 'Sign out',
                  onTap: state.signOut,
                ),
              ],
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
      width: 44,
      height: 44,
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

// ── Navigation widgets ──────────────────────────────────────────────────────

class _NavButton extends StatelessWidget {
  const _NavButton({required this.item, required this.active, required this.onTap});

  final _NavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      selected: active,
      button: true,
      label: item.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: const BoxConstraints(minWidth: 64, minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  item.icon,
                  size: 22,
                  color: active ? scheme.primary : scheme.onSurfaceVariant,
                ),
                const SizedBox(height: 2),
                Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: active ? scheme.primary : scheme.onSurfaceVariant,
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
  const _Sidebar({required this.state});

  final AppState state;

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
                      active: state.page == item.page,
                      onTap: () => state.navigate(item.page),
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
  const _SideNavBtn({required this.item, required this.active, required this.onTap});

  final _NavItem item;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
          child: Container(
            constraints: const BoxConstraints(minHeight: 52),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  item.icon,
                  size: 20,
                  color: active ? scheme.primary : scheme.onSurfaceVariant,
                ),
                const SizedBox(width: 12),
                Text(
                  item.label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                    color: active ? scheme.primary : scheme.onSurfaceVariant,
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

// ── SOS ─────────────────────────────────────────────────────────────────────

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
                    Icon(Icons.emergency, size: 48, color: Colors.white),
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
                      onPressed: () => Navigator.of(ctx).pop(),
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
