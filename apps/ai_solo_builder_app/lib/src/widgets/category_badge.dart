import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A color-coded category badge widget that displays a category name
/// with its associated brand color.
///
/// The badge uses a pill shape with a translucent background and
/// full-opacity text in the category's color.
class CategoryBadge extends StatelessWidget {
  /// The category slug (e.g., 'morning-summary', 'news', 'products').
  final String category;

  /// Optional display text override. If not provided, uses the category slug.
  final String? displayText;

  /// Optional size variant for the badge.
  final CategoryBadgeSize size;

  const CategoryBadge({
    super.key,
    required this.category,
    this.displayText,
    this.size = CategoryBadgeSize.medium,
  });

  @override
  Widget build(BuildContext context) {
    final categoryColor = AppColors.getCategoryColor(category);
    final backgroundColor = categoryColor.withValues(alpha: 0.2);

    // Get size-specific values
    final fontSize = _getFontSize();
    final horizontalPadding = _getHorizontalPadding();
    final verticalPadding = _getVerticalPadding();

    // Get display text
    final text = displayText ?? _getCategoryDisplayName(category);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: categoryColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          height: 1.0,
        ),
      ),
    );
  }

  double _getFontSize() {
    switch (size) {
      case CategoryBadgeSize.small:
        return 10;
      case CategoryBadgeSize.medium:
        return 11;
      case CategoryBadgeSize.large:
        return 12;
    }
  }

  double _getHorizontalPadding() {
    switch (size) {
      case CategoryBadgeSize.small:
        return 6;
      case CategoryBadgeSize.medium:
        return 8;
      case CategoryBadgeSize.large:
        return 10;
    }
  }

  double _getVerticalPadding() {
    switch (size) {
      case CategoryBadgeSize.small:
        return 2;
      case CategoryBadgeSize.medium:
        return 4;
      case CategoryBadgeSize.large:
        return 6;
    }
  }

  /// Returns a human-readable category name from the category slug.
  String _getCategoryDisplayName(String category) {
    switch (category) {
      case 'morning-summary':
        return '朝のまとめ';
      case 'evening-summary':
        return '夕のまとめ';
      case 'news':
        return 'ニュース';
      case 'products':
        return 'プロダクト';
      case 'dev-knowledge':
        return 'AI開発ナレッジ';
      case 'case-study':
        return '事例紹介';
      default:
        return category;
    }
  }
}

/// Size variants for the category badge.
enum CategoryBadgeSize {
  small,
  medium,
  large,
}
