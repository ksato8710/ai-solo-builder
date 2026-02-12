import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/content_models.dart';

class ContentApiException implements Exception {
  ContentApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() {
    if (statusCode == null) {
      return 'ContentApiException: $message';
    }
    return 'ContentApiException($statusCode): $message';
  }
}

class ContentApiClient {
  ContentApiClient({http.Client? httpClient, String? baseUrl})
    : _httpClient = httpClient ?? http.Client(),
      _baseUrl = _normalizeBaseUrl(baseUrl ?? _defaultBaseUrl);

  static const String _defaultBaseUrl = String.fromEnvironment(
    'CONTENT_API_BASE_URL',
    defaultValue: 'https://ai.essential-navigator.com',
  );

  final http.Client _httpClient;
  final String _baseUrl;

  Future<FeedResponse> fetchFeed({int limit = 8}) async {
    final uri = _buildUri(
      '/api/v1/feed',
      queryParameters: {'limit': limit.toString()},
    );

    final json = await _getJson(uri);
    return FeedResponse.fromJson(json);
  }

  Future<List<ContentSummary>> fetchContents({
    String? contentType,
    String? digestEdition,
    String? category,
    List<String> tags = const [],
    int limit = 20,
    int offset = 0,
  }) async {
    final queryParameters = <String, String>{
      if (tags.isNotEmpty) 'tags': tags.join(','),
      'limit': limit.toString(),
      'offset': offset.toString(),
    };

    if (contentType != null) {
      queryParameters['contentType'] = contentType;
    }
    if (digestEdition != null) {
      queryParameters['digestEdition'] = digestEdition;
    }
    if (category != null) {
      queryParameters['category'] = category;
    }

    final uri = _buildUri('/api/v1/contents', queryParameters: queryParameters);

    final json = await _getJson(uri);
    final items = json['items'];
    if (items is! List) {
      return const [];
    }

    return items
        .whereType<Map<String, dynamic>>()
        .map(ContentSummary.fromJson)
        .toList(growable: false);
  }

  Future<ContentDetail> fetchContentDetail(String slug) async {
    final uri = _buildUri('/api/v1/contents/$slug');
    final json = await _getJson(uri);

    final item = json['item'];
    if (item is! Map<String, dynamic>) {
      throw ContentApiException('Invalid content detail payload');
    }

    return ContentDetail.fromJson(item);
  }

  Uri _buildUri(String path, {Map<String, String>? queryParameters}) {
    final query = queryParameters == null || queryParameters.isEmpty
        ? null
        : queryParameters;
    return Uri.parse('$_baseUrl$path').replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _getJson(Uri uri) async {
    final response = await _httpClient.get(
      uri,
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ContentApiException(
        'Request failed for $uri',
        statusCode: response.statusCode,
      );
    }

    final body = jsonDecode(response.body);
    if (body is! Map<String, dynamic>) {
      throw ContentApiException('Invalid response payload for $uri');
    }

    return body;
  }

  static String _normalizeBaseUrl(String url) {
    if (url.endsWith('/')) {
      return url.substring(0, url.length - 1);
    }
    return url;
  }
}
