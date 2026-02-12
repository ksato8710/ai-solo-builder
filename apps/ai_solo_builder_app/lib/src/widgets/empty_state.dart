import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A unified empty state widget that displays an icon and message
/// when there is no content to show.
///
/// This provides a consistent empty state experience across the app.
class EmptyState extends StatelessWidget {
  /// The message to display.
  final String message;

  /// Optional icon to display. Defaults to inbox/empty icon.
  final IconData? icon;

  /// Optional subtitle for additional context.
  final String? subtitle;

  const EmptyState({
    super.key,
    required this.message,
    this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon ?? Icons.inbox_outlined,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
