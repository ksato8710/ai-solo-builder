import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/content_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../widgets/loading_state.dart';
import '../widgets/section_header.dart';
import 'content_detail_screen.dart';

/// News list screen with infinite scroll pagination.
///
/// Features:
/// - Digest section at top (morning/evening summaries)
/// - Latest news below with infinite scroll
/// - Pull-to-refresh
/// - Loading states for initial load and pagination
class NewsListScreen extends StatefulWidget {
  const NewsListScreen({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<NewsListScreen> createState() => _NewsListScreenState();
}

class _NewsListScreenState extends State<NewsListScreen>
    with AutomaticKeepAliveClientMixin {
  final List<ContentSummary> _digestItems = [];
  final List<ContentSummary> _newsItems = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  String? _error;
  int _offset = 0;
  static const int _pageSize = 20;
  final ScrollController _scrollController = ScrollController();

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _loadInitial();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMore) {
        _loadMore();
      }
    }
  }

  Future<void> _loadInitial() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Fetch digests and news in parallel
      final results = await Future.wait([
        widget.apiClient.fetchContents(contentType: 'digest', limit: 10),
        widget.apiClient.fetchContents(contentType: 'news', limit: _pageSize),
      ]);

      final digestResponse = results[0];
      final newsResponse = results[1];

      setState(() {
        _digestItems.clear();
        _digestItems.addAll(digestResponse.items);

        _newsItems.clear();
        _newsItems.addAll(newsResponse.items);

        _offset = newsResponse.items.length;
        _hasMore = newsResponse.hasMore;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final response = await widget.apiClient.fetchContents(
        contentType: 'news',
        limit: _pageSize,
        offset: _offset,
      );

      setState(() {
        _newsItems.addAll(response.items);
        _offset += response.items.length;
        _hasMore = response.hasMore;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingMore = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('追加読み込みに失敗しました: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _refresh() async {
    _offset = 0;
    _hasMore = true;
    await _loadInitial();
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

  @override
  Widget build(BuildContext context) {
    super.build(context); // Required for AutomaticKeepAliveClientMixin

    return Scaffold(
      appBar: AppBar(title: const Text('ニュース')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingState(message: 'ニュースを読み込んでいます...');
    }

    if (_error != null) {
      return ErrorState(
        message: 'ニュースの取得に失敗しました。',
        onRetry: _refresh,
      );
    }

    if (_digestItems.isEmpty && _newsItems.isEmpty) {
      return const EmptyState(
        message: 'ニュースがありません。',
        subtitle: 'プルダウンして更新してください。',
      );
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      color: AppColors.brandBlue,
      backgroundColor: AppColors.cardBackground,
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: _calculateItemCount(),
        itemBuilder: (context, index) {
          // Digest section
          if (_digestItems.isNotEmpty) {
            if (index == 0) {
              return Column(
                children: [
                  const SectionHeader(title: 'まとめ'),
                  const SizedBox(height: 8),
                ],
              );
            }
            if (index <= _digestItems.length) {
              return ContentCard(
                item: _digestItems[index - 1],
                onTap: () => _openDetail(_digestItems[index - 1]),
              );
            }

            // News section header
            if (index == _digestItems.length + 1) {
              return Column(
                children: [
                  const SizedBox(height: 16),
                  const SectionHeader(title: '最新ニュース'),
                  const SizedBox(height: 8),
                ],
              );
            }
          }

          // News items
          final newsIndex = _digestItems.isEmpty
              ? index
              : index - _digestItems.length - 2;

          if (newsIndex >= 0 && newsIndex < _newsItems.length) {
            return ContentCard(
              item: _newsItems[newsIndex],
              onTap: () => _openDetail(_newsItems[newsIndex]),
            );
          }

          // Loading more indicator
          if (_isLoadingMore) {
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              alignment: Alignment.center,
              child: const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandBlue),
              ),
            );
          }

          // End of list message
          if (!_hasMore && _newsItems.isNotEmpty) {
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              alignment: Alignment.center,
              child: const Text(
                'すべてのニュースを読み込みました',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  int _calculateItemCount() {
    int count = 0;

    // Digest section
    if (_digestItems.isNotEmpty) {
      count += 1; // Section header
      count += _digestItems.length; // Digest items
      count += 1; // News section header
    }

    // News items
    count += _newsItems.length;

    // Loading indicator or end message
    if (_isLoadingMore || (!_hasMore && _newsItems.isNotEmpty)) {
      count += 1;
    }

    return count;
  }
}
