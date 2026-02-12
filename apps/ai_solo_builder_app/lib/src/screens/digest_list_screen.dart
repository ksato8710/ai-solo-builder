import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../theme/app_colors.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../widgets/loading_state.dart';
import 'content_detail_screen.dart';

class DigestListScreen extends StatefulWidget {
  const DigestListScreen({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<DigestListScreen> createState() => _DigestListScreenState();
}

class _DigestListScreenState extends State<DigestListScreen>
    with AutomaticKeepAliveClientMixin {
  final List<ContentSummary> _items = [];
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

  Future<void> _loadInitial() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final result = await widget.apiClient.fetchContents(
        contentType: 'digest',
        limit: _pageSize,
        offset: 0,
      );
      setState(() {
        _items.clear();
        _items.addAll(result.items);
        _offset = result.items.length;
        _hasMore = result.hasMore;
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
      final result = await widget.apiClient.fetchContents(
        contentType: 'digest',
        limit: _pageSize,
        offset: _offset,
      );
      setState(() {
        _items.addAll(result.items);
        _offset += result.items.length;
        _hasMore = result.hasMore;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() => _isLoadingMore = false);
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
    super.build(context);

    return Scaffold(
      appBar: AppBar(title: const Text('ダイジェスト')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const LoadingState(message: 'ダイジェストを読み込んでいます...');
    }

    if (_error != null) {
      return ErrorState(
        message: 'ダイジェストの取得に失敗しました。',
        onRetry: _refresh,
      );
    }

    if (_items.isEmpty) {
      return const EmptyState(
        message: 'ダイジェストがありません。',
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
        itemCount: _items.length + (_isLoadingMore || !_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index < _items.length) {
            final item = _items[index];
            final showDateHeader = index == 0 ||
                _items[index].date != _items[index - 1].date;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showDateHeader) _DateHeader(date: item.date),
                _DigestCard(item: item, onTap: () => _openDetail(item)),
              ],
            );
          }

          // Footer
          if (_isLoadingMore) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: CircularProgressIndicator(
                  valueColor:
                      AlwaysStoppedAnimation<Color>(AppColors.brandBlue),
                ),
              ),
            );
          }
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(
                'すべてのダイジェストを読み込みました',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Date separator shown when the date changes in the timeline.
class _DateHeader extends StatelessWidget {
  const _DateHeader({required this.date});

  final String date;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 20,
            decoration: BoxDecoration(
              color: AppColors.brandBlue,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            date,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Divider(color: AppColors.cardHover, thickness: 1),
          ),
        ],
      ),
    );
  }
}

/// Card for a digest item with thumbnail, edition badge (朝/夕), and content.
class _DigestCard extends StatelessWidget {
  const _DigestCard({required this.item, required this.onTap});

  final ContentSummary item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isMorning = item.digestEdition == 'morning';
    final editionLabel = isMorning ? '朝刊' : '夕刊';
    final editionColor =
        isMorning ? AppColors.morningBlue : AppColors.eveningOrange;
    final hasImage = item.image != null && item.image!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: AppColors.cardHover.withValues(alpha: 0.5),
          highlightColor: AppColors.cardHover.withValues(alpha: 0.3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thumbnail image
              ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                child: Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 8,
                      child: hasImage
                          ? Image.network(
                              item.image!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) =>
                                  _buildImagePlaceholder(editionColor),
                            )
                          : _buildImagePlaceholder(editionColor),
                    ),
                    // Edition badge overlay
                    Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: editionColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isMorning ? Icons.wb_sunny : Icons.nights_stay,
                              color: Colors.white,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              editionLabel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Text content
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                    if (item.description.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      '${item.readTime}分で読める',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder(Color accentColor) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accentColor.withValues(alpha: 0.4),
            AppColors.cardBackground,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.auto_stories,
          size: 40,
          color: AppColors.textSecondary.withValues(alpha: 0.4),
        ),
      ),
    );
  }
}
