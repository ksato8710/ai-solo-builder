import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/content_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../widgets/loading_state.dart';
import 'content_detail_screen.dart';

class NewsListScreen extends StatefulWidget {
  const NewsListScreen({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<NewsListScreen> createState() => _NewsListScreenState();
}

class _NewsListScreenState extends State<NewsListScreen>
    with AutomaticKeepAliveClientMixin {
  // All loaded items (unfiltered) for tag extraction
  final List<ContentSummary> _allItems = [];
  // Currently displayed items (filtered)
  final List<ContentSummary> _displayedItems = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  String? _error;
  int _offset = 0;
  static const int _pageSize = 20;
  final ScrollController _scrollController = ScrollController();

  /// Available tags extracted from loaded items, with counts.
  Map<String, int> _tagCounts = {};

  /// Currently selected tag filter. null = "すべて".
  String? _selectedTag;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadInitial();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _hasMore) {
      _loadMore();
    }
  }

  void _rebuildTagCounts() {
    final counts = <String, int>{};
    for (final item in _allItems) {
      for (final tag in item.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    _tagCounts = counts;
  }

  void _applyFilter() {
    if (_selectedTag == null) {
      _displayedItems
        ..clear()
        ..addAll(_allItems);
    } else {
      _displayedItems
        ..clear()
        ..addAll(
            _allItems.where((item) => item.tags.contains(_selectedTag!)));
    }
  }

  Future<void> _loadInitial() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await widget.apiClient.fetchContents(
        contentType: 'news',
        limit: _pageSize,
        offset: 0,
      );

      setState(() {
        _allItems
          ..clear()
          ..addAll(response.items);
        _offset = response.items.length;
        _hasMore = response.hasMore;
        _rebuildTagCounts();
        _applyFilter();
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

    setState(() => _isLoadingMore = true);

    try {
      final response = await widget.apiClient.fetchContents(
        contentType: 'news',
        limit: _pageSize,
        offset: _offset,
      );

      setState(() {
        _allItems.addAll(response.items);
        _offset += response.items.length;
        _hasMore = response.hasMore;
        _rebuildTagCounts();
        _applyFilter();
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() => _isLoadingMore = false);
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
    _selectedTag = null;
    await _loadInitial();
  }

  void _selectTag(String? tag) {
    setState(() {
      _selectedTag = tag;
      _applyFilter();
    });
    // Scroll back to top on filter change
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
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
    super.build(context);

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

    if (_allItems.isEmpty) {
      return const EmptyState(
        message: 'ニュースがありません。',
        subtitle: 'プルダウンして更新してください。',
      );
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      color: AppColors.brandBlue,
      backgroundColor: AppColors.cardBackground,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Filter chips
          SliverToBoxAdapter(child: _buildChips()),

          // Article list
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index < _displayedItems.length) {
                    final item = _displayedItems[index];
                    return ContentCard(
                      item: item,
                      onTap: () => _openDetail(item),
                    );
                  }
                  // Footer
                  if (_isLoadingMore) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.brandBlue),
                        ),
                      ),
                    );
                  }
                  if (!_hasMore) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          'すべてのニュースを読み込みました',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
                childCount: _displayedItems.length +
                    (_isLoadingMore || !_hasMore ? 1 : 0),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChips() {
    // Sort tags by count descending
    final sortedTags = _tagCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        children: [
          // "すべて" chip
          _FilterChip(
            label: 'すべて',
            count: _allItems.length,
            isSelected: _selectedTag == null,
            onTap: () => _selectTag(null),
          ),
          ...sortedTags.map(
            (entry) => _FilterChip(
              label: entry.key,
              count: entry.value,
              isSelected: _selectedTag == entry.key,
              onTap: () => _selectTag(entry.key),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.count,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: isSelected ? AppColors.brandBlue : AppColors.cardBackground,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected
                    ? AppColors.brandBlue
                    : AppColors.cardHover,
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.white.withValues(alpha: 0.2)
                        : AppColors.cardHover,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '$count',
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
