import 'package:flutter/material.dart';

import '../models/content_models.dart';

class ContentCard extends StatelessWidget {
  const ContentCard({super.key, required this.item, required this.onTap});

  final ContentSummary item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final subtitle = item.description.trim().isEmpty
        ? '${item.date} • ${item.readTime} min read'
        : item.description;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        title: Text(
          item.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  _Badge(label: item.contentType),
                  if (item.digestEdition != null)
                    _Badge(label: item.digestEdition!),
                  if (item.tags.isNotEmpty) _Badge(label: item.tags.first),
                ],
              ),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.blueGrey.shade50,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, color: Colors.blueGrey.shade700),
      ),
    );
  }
}
