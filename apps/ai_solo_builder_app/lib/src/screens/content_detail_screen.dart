import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/category_badge.dart';
import '../widgets/error_state.dart';
import '../widgets/empty_state.dart';
import '../widgets/loading_state.dart';

/// Content detail screen with dark theme design.
/// Displays full article content with hero image, metadata, and markdown content.
class ContentDetailScreen extends StatefulWidget {
  const ContentDetailScreen({
    super.key,
    required this.slug,
    required this.apiClient,
    this.preview,
  });

  final String slug;
  final ContentSummary? preview;
  final ContentApiClient apiClient;

  @override
  State<ContentDetailScreen> createState() => _ContentDetailScreenState();
}

class _ContentDetailScreenState extends State<ContentDetailScreen> {
  late Future<ContentDetail> _detailFuture;

  @override
  void initState() {
    super.initState();
    _detailFuture = widget.apiClient.fetchContentDetail(widget.slug);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          widget.preview?.title ?? '記事詳細',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: FutureBuilder<ContentDetail>(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingState(message: '記事を読み込み中...');
          }

          if (snapshot.hasError) {
            return ErrorState(
              message: '記事の取得に失敗しました。',
              onRetry: () {
                setState(() {
                  _detailFuture = widget.apiClient.fetchContentDetail(
                    widget.slug,
                  );
                });
              },
            );
          }

          final detail = snapshot.data;
          if (detail == null) {
            return const EmptyState(message: '記事が見つかりません。');
          }

          return _buildContent(detail);
        },
      ),
    );
  }

  Widget _buildContent(ContentDetail detail) {
    final summary = detail.summary;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero image (if available)
          if (summary.image != null && summary.image!.isNotEmpty)
            Image.network(
              summary.image!,
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: double.infinity,
                height: 200,
                color: AppColors.cardHover,
                child: const Icon(
                  Icons.image_not_supported,
                  size: 48,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          // Content area
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category badge
                CategoryBadge(
                  category: summary.category,
                  size: CategoryBadgeSize.medium,
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  summary.title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                // Meta row (date + read time)
                Row(
                  children: [
                    Text(
                      summary.date,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${summary.readTime}分',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Divider
                const Divider(
                  color: AppColors.cardHover,
                  thickness: 1,
                  height: 1,
                ),
                const SizedBox(height: 16),
                // Markdown content
                MarkdownBody(
                  data: detail.content,
                  styleSheet: _buildMarkdownStyleSheet(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  MarkdownStyleSheet _buildMarkdownStyleSheet() {
    return MarkdownStyleSheet(
      // Headings
      h1: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        height: 1.3,
      ),
      h2: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 22,
        fontWeight: FontWeight.bold,
        height: 1.3,
      ),
      h3: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 20,
        fontWeight: FontWeight.bold,
        height: 1.4,
      ),
      h4: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.bold,
        height: 1.4,
      ),
      h5: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 16,
        fontWeight: FontWeight.bold,
        height: 1.4,
      ),
      h6: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 14,
        fontWeight: FontWeight.bold,
        height: 1.4,
      ),
      // Body text
      p: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 14,
        height: 1.7,
      ),
      // Links
      a: const TextStyle(
        color: AppColors.brandBlue,
        decoration: TextDecoration.underline,
      ),
      // Lists
      listBullet: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 14,
      ),
      // Code
      code: const TextStyle(
        color: AppColors.textPrimary,
        backgroundColor: AppColors.cardBackground,
        fontFamily: 'monospace',
        fontSize: 13,
      ),
      codeblockDecoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppColors.cardHover,
          width: 1,
        ),
      ),
      codeblockPadding: const EdgeInsets.all(12),
      // Blockquote
      blockquote: const TextStyle(
        color: AppColors.textSecondary,
        fontSize: 14,
        fontStyle: FontStyle.italic,
        height: 1.7,
      ),
      blockquoteDecoration: BoxDecoration(
        color: AppColors.cardBackground,
        border: const Border(
          left: BorderSide(
            color: AppColors.brandBlue,
            width: 4,
          ),
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      blockquotePadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
      // Tables
      tableHead: const TextStyle(
        color: AppColors.textPrimary,
        fontWeight: FontWeight.bold,
        fontSize: 14,
      ),
      tableBody: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 14,
      ),
      tableBorder: TableBorder.all(
        color: AppColors.cardHover,
        width: 1,
      ),
      // Horizontal rule
      horizontalRuleDecoration: const BoxDecoration(
        border: Border(
          top: BorderSide(
            color: AppColors.cardHover,
            width: 1,
          ),
        ),
      ),
    );
  }
}
