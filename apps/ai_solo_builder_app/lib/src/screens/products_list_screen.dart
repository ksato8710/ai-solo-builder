import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/category_badge.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../widgets/loading_state.dart';
import 'content_detail_screen.dart';

/// Products grid screen with infinite scroll pagination.
///
/// Features:
/// - 2-column grid layout
/// - Product cards with image, title, description
/// - Pull-to-refresh
/// - Infinite scroll pagination
class ProductsListScreen extends StatefulWidget {
  const ProductsListScreen({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<ProductsListScreen> createState() => _ProductsListScreenState();
}

class _ProductsListScreenState extends State<ProductsListScreen>
    with AutomaticKeepAliveClientMixin {
  final List<ContentSummary> _products = [];
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
      final response = await widget.apiClient.fetchContents(
        contentType: 'product',
        limit: _pageSize,
      );

      setState(() {
        _products.clear();
        _products.addAll(response.items);
        _offset = response.items.length;
        _hasMore = response.hasMore;
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
        contentType: 'product',
        limit: _pageSize,
        offset: _offset,
      );

      setState(() {
        _products.addAll(response.items);
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
      appBar: AppBar(title: const Text('プロダクト')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingState(message: 'プロダクトを読み込んでいます...');
    }

    if (_error != null) {
      return ErrorState(
        message: 'プロダクトの取得に失敗しました。',
        onRetry: _refresh,
      );
    }

    if (_products.isEmpty) {
      return const EmptyState(
        message: 'プロダクトがありません。',
        subtitle: 'プルダウンして更新してください。',
        icon: Icons.apps_outlined,
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
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index < _products.length) {
                    return _ProductCard(
                      item: _products[index],
                      onTap: () => _openDetail(_products[index]),
                    );
                  }
                  return null;
                },
                childCount: _products.length,
              ),
            ),
          ),
          if (_isLoadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor:
                        AlwaysStoppedAnimation<Color>(AppColors.brandBlue),
                  ),
                ),
              ),
            ),
          if (!_hasMore && _products.isNotEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'すべてのプロダクトを読み込みました',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Product card widget for grid display.
class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.item,
    required this.onTap,
  });

  final ContentSummary item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product image
            AspectRatio(
              aspectRatio: 1.5,
              child: item.image != null && item.image!.isNotEmpty
                  ? Image.network(
                      item.image!,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildPlaceholder();
                      },
                    )
                  : _buildPlaceholder(),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category badge
                    CategoryBadge(
                      category: item.category,
                      size: CategoryBadgeSize.small,
                    ),
                    const SizedBox(height: 8),
                    // Product title
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    // Product description
                    if (item.description.isNotEmpty)
                      Expanded(
                        child: Text(
                          item.description,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            height: 1.4,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: AppColors.cardHover,
      child: const Center(
        child: Icon(
          Icons.apps,
          size: 48,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
