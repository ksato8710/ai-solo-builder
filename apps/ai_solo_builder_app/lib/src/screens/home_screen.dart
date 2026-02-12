import 'package:flutter/material.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';
import '../widgets/content_card.dart';
import 'content_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.apiClient});

  final ContentApiClient apiClient;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<FeedResponse> _feedFuture;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Solo Builder')),
      body: FutureBuilder<FeedResponse>(
        future: _feedFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _ErrorState(message: 'フィードの取得に失敗しました。', onRetry: _refresh);
          }

          final feed = snapshot.data;
          if (feed == null) {
            return const _EmptyState(message: 'コンテンツがありません。');
          }

          final sections = [
            _SectionData(title: '朝刊', items: feed.sections.morningSummary),
            _SectionData(title: '夕刊', items: feed.sections.eveningSummary),
            _SectionData(title: '最新ニュース', items: feed.sections.latestNews),
            _SectionData(title: '開発ナレッジ', items: feed.sections.devKnowledge),
            _SectionData(title: 'ソロビルダー事例', items: feed.sections.caseStudies),
            _SectionData(title: 'プロダクト', items: feed.sections.products),
          ];

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                _FeedMeta(generatedAt: feed.generatedAt),
                const SizedBox(height: 8),
                ...sections.map(
                  (section) => _Section(
                    title: section.title,
                    items: section.items,
                    onTap: _openDetail,
                  ),
                ),
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
        : generatedAt!.toLocal().toString();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blueGrey.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '更新: $generatedAtText',
        style: TextStyle(color: Colors.blueGrey.shade700),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.title,
    required this.items,
    required this.onTap,
  });

  final String title;
  final List<ContentSummary> items;
  final ValueChanged<ContentSummary> onTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text('該当コンテンツはありません。'),
          )
        else
          ...items
              .take(5)
              .map((item) => ContentCard(item: item, onTap: () => onTap(item))),
      ],
    );
  }
}

class _SectionData {
  const _SectionData({required this.title, required this.items});

  final String title;
  final List<ContentSummary> items;
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                onRetry();
              },
              child: const Text('再試行'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(message, textAlign: TextAlign.center),
      ),
    );
  }
}
