import 'dart:convert';

import 'package:ai_solo_builder_app/main.dart';
import 'package:ai_solo_builder_app/src/services/content_api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  testWidgets('renders app shell', (WidgetTester tester) async {
    final mockClient = MockClient((request) async {
      if (request.url.path == '/api/v1/feed') {
        return http.Response(
          jsonEncode({
            'generatedAt': '2026-02-12T00:00:00.000Z',
            'sections': {
              'morningSummary': [],
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

      return http.Response('{}', 404);
    });

    final apiClient = ContentApiClient(
      httpClient: mockClient,
      baseUrl: 'https://example.com',
    );

    await tester.pumpWidget(AiSoloBuilderApp(apiClient: apiClient));
    await tester.pump();

    expect(find.text('AI Solo Builder'), findsOneWidget);
    expect(find.text('朝刊'), findsOneWidget);
  });
}
