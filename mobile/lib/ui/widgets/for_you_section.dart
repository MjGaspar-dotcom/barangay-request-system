import 'package:flutter/material.dart';

import '../../core/models/request_model.dart';
import '../../core/providers/request_provider.dart';
import '../../core/theme/app_theme.dart';

class ForYouSection extends StatelessWidget {
  final List<DocumentType> recommendedDocuments;
  final DocumentTypesStatus status;
  final String? ageGroup;
  final String? errorMessage;
  final VoidCallback onRetry;
  final ValueChanged<DocumentType> onRequestDocument;

  const ForYouSection({
    super.key,
    required this.recommendedDocuments,
    required this.status,
    required this.ageGroup,
    required this.errorMessage,
    required this.onRetry,
    required this.onRequestDocument,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'For You',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          ageGroup == null
              ? 'General document recommendations'
              : 'Top documents for $ageGroup',
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        if (status == DocumentTypesStatus.initial ||
            status == DocumentTypesStatus.loading)
          const SizedBox(
            height: 180,
            child: Center(child: CircularProgressIndicator()),
          )
        else if (status == DocumentTypesStatus.error)
          _FeedError(
            message: errorMessage ?? 'Documents are unavailable.',
            onRetry: onRetry,
          )
        else if (recommendedDocuments.isEmpty)
          const _FeedEmpty()
        else
          LayoutBuilder(
            builder: (context, constraints) {
              final cardWidth = constraints.maxWidth < 440
                  ? constraints.maxWidth * 0.84
                  : ((constraints.maxWidth - 12) / 2).clamp(0.0, 280.0);

              return SizedBox(
                height: 210,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: recommendedDocuments.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) => _RecommendationCard(
                    width: cardWidth,
                    documentType: recommendedDocuments[index],
                    onRequest: onRequestDocument,
                  ),
                ),
              );
            },
          ),
        if (status == DocumentTypesStatus.loaded && errorMessage != null)
          _FeedRefreshWarning(
            message: errorMessage!,
            onRetry: onRetry,
          ),
      ],
    );
  }
}

class _FeedRefreshWarning extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _FeedRefreshWarning({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Showing saved results. Refresh failed: $message',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

class _RecommendationCard extends StatelessWidget {
  final double width;
  final DocumentType documentType;
  final ValueChanged<DocumentType> onRequest;

  const _RecommendationCard({
    required this.width,
    required this.documentType,
    required this.onRequest,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'RECOMMENDED DOCUMENT',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                documentType.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  documentType.description?.trim().isNotEmpty == true
                      ? documentType.description!
                      : 'Available from the barangay.',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.3,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              if (documentType.processingTimeMinutes != null)
                Text(
                  'Processing: ${documentType.processingTimeMinutes} min',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => onRequest(documentType),
                  child: const Text('Request'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeedEmpty extends StatelessWidget {
  const _FeedEmpty();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: const Row(
        children: [
          Icon(Icons.campaign_outlined, color: AppColors.primary),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'No documents match your age eligibility yet.',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeedError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _FeedError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
