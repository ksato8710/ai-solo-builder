import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';

import '../models/content_models.dart';
import '../services/content_api_client.dart';

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
      appBar: AppBar(title: Text(widget.preview?.title ?? '記事詳細')),
      body: FutureBuilder<ContentDetail>(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return _ErrorState(
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
            return const _EmptyState(message: '記事が見つかりません。');
          }

          final summary = detail.summary;

          return Markdown(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            data:
                '''
# ${summary.title}

${summary.date} • ${summary.readTime} min read

${detail.content}
''',
          );
        },
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

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
            ElevatedButton(onPressed: onRetry, child: const Text('再試行')),
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
