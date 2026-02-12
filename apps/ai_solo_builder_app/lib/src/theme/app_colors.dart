import 'dart:ui';

/// Static color constants for the AI Solo Builder app brand.
/// All colors follow the TLDR.tech-inspired dark theme palette.
class AppColors {
  AppColors._(); // Private constructor to prevent instantiation

  // Background Colors
  static const Color background = Color(0xFF0F172A); // Dark navy
  static const Color cardBackground = Color(0xFF1E293B); // Slightly lighter
  static const Color cardHover = Color(0xFF334155); // Card hover/pressed state

  // Text Colors
  static const Color textPrimary = Color(0xFFE2E8F0); // Light gray
  static const Color textSecondary = Color(0xFF94A3B8); // Slate gray

  // Brand Accent Colors
  static const Color brandBlue = Color(0xFF3B82F6); // Electric blue
  static const Color brandViolet = Color(0xFF8B5CF6); // Violet
  static const Color brandEmerald = Color(0xFF10B981); // Emerald

  // Category Colors
  static const Color morningBlue = Color(0xFF3B82F6); // morning-summary
  static const Color eveningOrange = Color(0xFFF97316); // evening-summary
  static const Color newsIndigo = Color(0xFF6366F1); // news
  static const Color productsViolet = Color(0xFF8B5CF6); // products
  static const Color devKnowledgeEmerald = Color(0xFF10B981); // dev-knowledge
  static const Color caseStudyAmber = Color(0xFFF59E0B); // case-study

  // Utility Colors
  static const Color error = Color(0xFFEF4444); // Red for errors
  static const Color warning = Color(0xFFF59E0B); // Amber for warnings
  static const Color success = Color(0xFF10B981); // Emerald for success

  /// Returns the appropriate category color for a given category slug.
  static Color getCategoryColor(String category) {
    switch (category) {
      case 'morning-summary':
        return morningBlue;
      case 'evening-summary':
        return eveningOrange;
      case 'news':
        return newsIndigo;
      case 'products':
        return productsViolet;
      case 'dev-knowledge':
        return devKnowledgeEmerald;
      case 'case-study':
        return caseStudyAmber;
      default:
        return brandBlue; // Fallback to brand blue
    }
  }

  /// Returns a category color with specified opacity.
  static Color getCategoryColorWithOpacity(String category, double opacity) {
    return getCategoryColor(category).withValues(alpha: opacity);
  }
}
