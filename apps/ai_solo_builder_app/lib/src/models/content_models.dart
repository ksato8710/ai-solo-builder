class ContentSummary {
  ContentSummary({
    required this.slug,
    required this.title,
    required this.date,
    required this.description,
    required this.readTime,
    required this.featured,
    required this.url,
    required this.category,
    required this.type,
    required this.contentType,
    required this.digestEdition,
    required this.tags,
    required this.relatedProducts,
    this.image,
  });

  final String slug;
  final String title;
  final String date;
  final String description;
  final int readTime;
  final bool featured;
  final String? image;
  final String url;
  final String category;
  final String type;
  final String contentType;
  final String? digestEdition;
  final List<String> tags;
  final List<String> relatedProducts;

  factory ContentSummary.fromJson(Map<String, dynamic> json) {
    return ContentSummary(
      slug: json['slug'] as String? ?? '',
      title: json['title'] as String? ?? '',
      date: json['date'] as String? ?? '',
      description: json['description'] as String? ?? '',
      readTime: (json['readTime'] as num?)?.toInt() ?? 0,
      featured: json['featured'] as bool? ?? false,
      image: json['image'] as String?,
      url: json['url'] as String? ?? '',
      category: json['category'] as String? ?? '',
      type: json['type'] as String? ?? 'news',
      contentType: json['contentType'] as String? ?? 'news',
      digestEdition: json['digestEdition'] as String?,
      tags: _toStringList(json['tags']),
      relatedProducts: _toStringList(json['relatedProducts']),
    );
  }
}

class ContentDetail {
  ContentDetail({
    required this.summary,
    required this.content,
    this.htmlContent,
  });

  final ContentSummary summary;
  final String content;
  final String? htmlContent;

  factory ContentDetail.fromJson(Map<String, dynamic> json) {
    return ContentDetail(
      summary: ContentSummary.fromJson(json),
      content: json['content'] as String? ?? '',
      htmlContent: json['htmlContent'] as String?,
    );
  }
}

class FeedSections {
  FeedSections({
    required this.morningSummary,
    required this.eveningSummary,
    required this.latestNews,
    required this.products,
    required this.devKnowledge,
    required this.caseStudies,
  });

  final List<ContentSummary> morningSummary;
  final List<ContentSummary> eveningSummary;
  final List<ContentSummary> latestNews;
  final List<ContentSummary> products;
  final List<ContentSummary> devKnowledge;
  final List<ContentSummary> caseStudies;

  factory FeedSections.fromJson(Map<String, dynamic> json) {
    return FeedSections(
      morningSummary: _toSummaryList(json['morningSummary']),
      eveningSummary: _toSummaryList(json['eveningSummary']),
      latestNews: _toSummaryList(json['latestNews']),
      products: _toSummaryList(json['products']),
      devKnowledge: _toSummaryList(json['devKnowledge']),
      caseStudies: _toSummaryList(json['caseStudies']),
    );
  }
}

class FeedResponse {
  FeedResponse({required this.generatedAt, required this.sections});

  final DateTime? generatedAt;
  final FeedSections sections;

  factory FeedResponse.fromJson(Map<String, dynamic> json) {
    final generatedAtRaw = json['generatedAt'] as String?;
    return FeedResponse(
      generatedAt: generatedAtRaw == null
          ? null
          : DateTime.tryParse(generatedAtRaw),
      sections: FeedSections.fromJson(
        json['sections'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

List<ContentSummary> _toSummaryList(dynamic value) {
  if (value is! List) {
    return const [];
  }

  return value
      .whereType<Map<String, dynamic>>()
      .map(ContentSummary.fromJson)
      .toList(growable: false);
}

List<String> _toStringList(dynamic value) {
  if (value is! List) {
    return const [];
  }

  return value.whereType<String>().toList(growable: false);
}
