import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// CareConnect logo — rounded teal square with a white heart outline,
/// matching the Figma `Logo` SVG.
class CCLogo extends StatelessWidget {
  const CCLogo({super.key, this.size = 36});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: CCTokens.primaryLight,
        borderRadius: BorderRadius.circular(size * 0.22),
      ),
      child: CustomPaint(
        painter: _HeartPainter(),
        size: Size.square(size),
      ),
    );
  }
}

class _HeartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint =
        Paint()
          ..color = Colors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = size.width * 0.061
          ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final path = Path()
      ..moveTo(w * 0.5, w * 0.75)
      ..cubicTo(w * 0.47, w * 0.72, w * 0.25, w * 0.58, w * 0.25, w * 0.43)
      ..cubicTo(w * 0.25, w * 0.35, w * 0.31, w * 0.28, w * 0.39, w * 0.28)
      ..cubicTo(w * 0.44, w * 0.28, w * 0.48, w * 0.31, w * 0.5, w * 0.35)
      ..cubicTo(w * 0.52, w * 0.31, w * 0.56, w * 0.28, w * 0.61, w * 0.28)
      ..cubicTo(w * 0.69, w * 0.28, w * 0.75, w * 0.35, w * 0.75, w * 0.43)
      ..cubicTo(w * 0.75, w * 0.58, w * 0.53, w * 0.72, w * 0.5, w * 0.75)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Status card used on the Dashboard — icon + label + value + sub, tappable.
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    required this.sub,
    required this.bg,
    required this.borderColor,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final String sub;
  final Color bg;
  final Color borderColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor, width: 2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 14, color: scheme.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      label.toUpperCase(),
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                ),
              ),
              Text(sub, style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dismissible warning alert card (Dashboard "Alerts" section).
class AlertCard extends StatefulWidget {
  const AlertCard({super.key, required this.icon, required this.title, required this.body});

  final IconData icon;
  final String title;
  final String body;

  @override
  State<AlertCard> createState() => _AlertCardState();
}

class _AlertCardState extends State<AlertCard> {
  bool dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (dismissed) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    final isLight = Theme.of(context).brightness == Brightness.light;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isLight ? CCTokens.warningBgLight : CCTokens.warningBgDark,
        borderRadius: CCTokens.borderRadius,
        border: Border.all(
          color: isLight ? CCTokens.warningBorderLight : CCTokens.warningBorderDark,
          width: 2,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(widget.icon, size: 20, color: scheme.onSurface),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.title,
                  style: TextStyle(fontWeight: FontWeight.w600, color: scheme.onSurface),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.body,
                  style: TextStyle(fontSize: 14, color: scheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 48,
            height: 48,
            child: IconButton(
              icon: const Icon(Icons.close, size: 18),
              tooltip: 'Dismiss alert',
              onPressed: () => setState(() => dismissed = true),
            ),
          ),
        ],
      ),
    );
  }
}
