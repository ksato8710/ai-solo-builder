import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A section header widget that displays a title with an optional
/// "See more" action link.
///
/// Features a left accent line in brand blue and consistent styling
/// for section titles throughout the app.
class SectionHeader extends StatelessWidget {
  /// The section title text.
  final String title;

  /// Optional callback for the "See more" action.
  /// If null, the "See more" link will not be displayed.
  final VoidCallback? onSeeMore;

  /// Optional custom text for the action button. Defaults to "もっと見る".
  final String? actionText;

  /// Optional icon for the title.
  final IconData? icon;

  const SectionHeader({
    super.key,
    required this.title,
    this.onSeeMore,
    this.actionText,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 0),
      child: Row(
        children: [
          // Left accent line
          Container(
            width: 4,
            height: 24,
            decoration: BoxDecoration(
              color: AppColors.brandBlue,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),

          // Optional icon
          if (icon != null) ...[
            Icon(
              icon,
              color: AppColors.textPrimary,
              size: 20,
            ),
            const SizedBox(width: 8),
          ],

          // Title
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                height: 1.3,
              ),
            ),
          ),

          // "See more" action
          if (onSeeMore != null)
            TextButton(
              onPressed: onSeeMore,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.brandBlue,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    actionText ?? 'もっと見る',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 12,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
