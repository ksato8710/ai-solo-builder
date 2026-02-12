import 'dart:convert';

import 'package:ai_solo_builder_app/main.dart';
import 'package:ai_solo_builder_app/src/services/content_api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

MockClient _buildMockClient() {
  return MockClient((request) async {
    if (request.url.path == '/api/v1/feed') {
      return http.Response(
        jsonEncode({
          'generatedAt': '2026-02-12T00:00:00.000Z',
          'sections': {
            'morningSummary': [
              {
                'slug': 'test-morning',
                'title': 'テスト朝刊記事',
                'date': '2026-02-12',
                'description': 'テスト説明文',
                'readTime': 3,
                'featured': true,
                'url': '/news/test-morning',
                'category': 'morning-summary',
                'type': 'news',
                'contentType': 'digest',
                'digestEdition': 'morning',
                'tags': [],
                'relatedProducts': [],
              }
            ],
            'eveningSummary': [],
            'latestNews': [],
            'products': [],
            'devKnowledge': [],
            'caseStudies': [],
          },
        }),
        200,
      );
    }

    if (request.url.path == '/api/v1/contents') {
      return http.Response(
        jsonEncode({
          'items': [],
          'total': 0,
          'limit': 20,
          'offset': 0,
        }),
        200,
      );
    }

    return http.Response('{}', 404);
  });
}

Future<void> _pumpApp(WidgetTester tester) async {
  final apiClient = ContentApiClient(
    httpClient: _buildMockClient(),
    baseUrl: 'https://example.com',
  );
  await tester.pumpWidget(AiSoloBuilderApp(apiClient: apiClient));
  // Let all async operations (feed, contents) complete
  await tester.pump(const Duration(seconds: 1));
  await tester.pump();
}

void main() {
  testWidgets('renders app with bottom navigation',
      (WidgetTester tester) async {
    await _pumpApp(tester);

    // Bottom navigation tabs
    expect(find.text('ホーム'), findsOneWidget);
    expect(find.text('ニュース'), findsOneWidget);
    expect(find.text('プロダクト'), findsOneWidget);

    // Home screen AppBar
    expect(find.text('AI Solo Builder'), findsOneWidget);
  });

  testWidgets('can navigate between tabs', (WidgetTester tester) async {
    await _pumpApp(tester);

    // Start on home tab
    expect(find.text('AI Solo Builder'), findsOneWidget);

    // Tap news tab
    await tester.tap(find.text('ニュース'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();

    // Tap products tab
    await tester.tap(find.text('プロダクト'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();

    // Tap back to home
    await tester.tap(find.text('ホーム'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();

    expect(find.text('AI Solo Builder'), findsOneWidget);
  });
}
