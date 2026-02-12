import 'package:flutter/material.dart';
import '../models/content_models.dart';
import '../theme/app_colors.dart';
import 'category_badge.dart';

/// A large featured card widget for prominent content display on the home screen.
/// Displays content with a large image, gradient overlay, and prominent title.
class FeaturedCard extends StatelessWidget {
  const FeaturedCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  final ContentSummary item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: AppColors.cardHover.withValues(alpha: 0.5),
          highlightColor: AppColors.cardHover.withValues(alpha: 0.3),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: double.infinity,
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background image or gradient
                    _buildBackground(),
                    // Dark gradient overlay at bottom
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: Container(
                        height: 200,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              AppColors.background.withValues(alpha: 0.7),
                              AppColors.background,
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Content overlay
                    Positioned(
                      left: 16,
                      right: 16,
                      top: 16,
                      bottom: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Category badge at top-left
                          CategoryBadge(
                            category: item.category,
                            size: CategoryBadgeSize.large,
                          ),
                          const Spacer(),
                          // Title and description at bottom
                          Text(
                            item.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              height: 1.3,
                              shadows: [
                                Shadow(
                                  color: Colors.black45,
                                  offset: Offset(0, 1),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (item.description.isNotEmpty)
                            Text(
                              item.description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 14,
                                height: 1.4,
                                shadows: const [
                                  Shadow(
                                    color: Colors.black45,
                                    offset: Offset(0, 1),
                                    blurRadius: 4,
                                  ),
                                ],
                              ),
                            ),
                          const SizedBox(height: 8),
                          // Metadata row
                          Row(
                            children: [
                              Text(
                                item.date,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontSize: 12,
                                  shadows: const [
                                    Shadow(
                                      color: Colors.black45,
                                      offset: Offset(0, 1),
                                      blurRadius: 3,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${item.readTime}分',
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontSize: 12,
                                  shadows: const [
                                    Shadow(
                                      color: Colors.black45,
                                      offset: Offset(0, 1),
                                      blurRadius: 3,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBackground() {
    // If image is available, show it
    if (item.image != null && item.image!.isNotEmpty) {
      return Image.network(
        item.image!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildGradientFallback(),
      );
    }

    // Fallback to gradient background
    return _buildGradientFallback();
  }

  Widget _buildGradientFallback() {
    // Create a gradient based on the category color
    final categoryColor = AppColors.getCategoryColor(item.category);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            categoryColor.withValues(alpha: 0.6),
            AppColors.cardBackground,
            AppColors.background,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.article_outlined,
          size: 64,
          color: AppColors.textSecondary.withValues(alpha: 0.3),
        ),
      ),
    );
  }
}
