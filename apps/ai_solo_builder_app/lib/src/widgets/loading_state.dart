import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A branded loading indicator widget that displays a centered spinner
/// with an optional message below it.
///
/// This provides a consistent loading experience across the app with
/// brand colors and styling.
class LoadingState extends StatelessWidget {
  /// Optional message to display below the loading spinner.
  final String? message;

  const LoadingState({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandBlue),
              strokeWidth: 3,
            ),
            if (message != null) ...[
              const SizedBox(height: 16),
              Text(
                message!,
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
