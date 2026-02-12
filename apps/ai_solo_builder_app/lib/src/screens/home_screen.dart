import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/content_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../widgets/featured_card.dart';
import '../widgets/loading_state.dart';
import '../widgets/section_header.dart';
import 'content_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.apiClient,
    this.onNavigateToTab,
  });

  final ContentApiClient apiClient;

  /// Callback to switch bottom navigation tab from MainShell.
  /// Index 1 = News, Index 2 = Products.
  final ValueChanged<int>? onNavigateToTab;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  late Future<FeedResponse> _feedFuture;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _feedFuture = widget.apiClient.fetchFeed(limit: 10);
  }

  Future<void> _refresh() async {
    setState(() {
      _feedFuture = widget.apiClient.fetchFeed(limit: 10);
    });
    await _feedFuture;
  }

  void _openDetail(ContentSummary item) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ContentDetailScreen(
          slug: item.slug,
          preview: item,
          apiClient: widget.apiClient,
        ),
      ),
    );
  }

  /// Pick the latest digest: prefer morning, fall back to evening.
  ContentSummary? _pickLatestDigest(FeedSections sections) {
    if (sections.morningSummary.isNotEmpty) {
      return sections.morningSummary.first;
    }
    if (sections.eveningSummary.isNotEmpty) {
      return sections.eveningSummary.first;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return Scaffold(
      appBar: AppBar(title: const Text('AI Solo Builder')),
      body: FutureBuilder<FeedResponse>(
        future: _feedFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingState(message: 'フィードを読み込んでいます...');
          }

          if (snapshot.hasError) {
            return ErrorState(
              message: 'フィードの取得に失敗しました。',
              onRetry: _refresh,
            );
          }

          final feed = snapshot.data;
          if (feed == null) {
            return const EmptyState(message: 'コンテンツがありません。');
          }

          final latestDigest = _pickLatestDigest(feed.sections);

          return RefreshIndicator(
            onRefresh: _refresh,
            color: AppColors.brandBlue,
            backgroundColor: AppColors.cardBackground,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                // 1) Hero: latest digest (morning or evening)
                if (latestDigest != null)
                  FeaturedCard(
                    item: latestDigest,
                    onTap: () => _openDetail(latestDigest),
                  ),

                // 2) Latest news — max 3, with "もっと見る"
                _Section(
                  title: '最新ニュース',
                  items: feed.sections.latestNews,
                  maxItems: 3,
                  onTap: _openDetail,
                  onSeeMore: widget.onNavigateToTab != null
                      ? () => widget.onNavigateToTab!(2)
                      : null,
                ),

                // 3) Case studies — max 3
                _Section(
                  title: 'ソロビルダー事例',
                  items: feed.sections.caseStudies,
                  maxItems: 3,
                  onTap: _openDetail,
                ),

                // 4) Dev knowledge
                _Section(
                  title: '開発ナレッジ',
                  items: feed.sections.devKnowledge,
                  maxItems: 3,
                  onTap: _openDetail,
                ),

                // 5) Products — max 3, with "もっと見る"
                _Section(
                  title: 'プロダクト',
                  items: feed.sections.products,
                  maxItems: 3,
                  onTap: _openDetail,
                  onSeeMore: widget.onNavigateToTab != null
                      ? () => widget.onNavigateToTab!(3)
                      : null,
                ),

                // 6) Update timestamp at the very bottom
                const SizedBox(height: 24),
                _FeedMeta(generatedAt: feed.generatedAt),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FeedMeta extends StatelessWidget {
  const _FeedMeta({required this.generatedAt});

  final DateTime? generatedAt;

  @override
  Widget build(BuildContext context) {
    final generatedAtText = generatedAt == null
        ? '-'
        : '${generatedAt!.toLocal().year}-${generatedAt!.toLocal().month.toString().padLeft(2, '0')}-${generatedAt!.toLocal().day.toString().padLeft(2, '0')} '
            '${generatedAt!.toLocal().hour.toString().padLeft(2, '0')}:${generatedAt!.toLocal().minute.toString().padLeft(2, '0')}';

    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.schedule, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Text(
            '最終更新: $generatedAtText',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.items,
    required this.onTap,
    this.maxItems = 3,
    this.onSeeMore,
  });

  final String title;
  final List<ContentSummary> items;
  final ValueChanged<ContentSummary> onTap;
  final int maxItems;
  final VoidCallback? onSeeMore;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        SectionHeader(title: title, onSeeMore: onSeeMore),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.cardHover.withValues(alpha: 0.5),
                width: 1,
              ),
            ),
            child: const Text(
              '該当コンテンツはありません。',
              style: TextStyle(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
          )
        else
          ...items
              .take(maxItems)
              .map((item) => ContentCard(item: item, onTap: () => onTap(item))),
      ],
    );
  }
}
