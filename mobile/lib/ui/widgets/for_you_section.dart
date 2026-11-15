import 'package:flutter/material.dart';

import '../../core/models/request_model.dart';
import '../../core/providers/request_provider.dart';

class ForYouSection extends StatelessWidget {
  final List<DocumentType> recommendedDocuments;
  final List<DocumentType> documentTypes;
  final DocumentTypesStatus status;
  final String? ageGroup;
  final String? errorMessage;
  final VoidCallback onRetry;
  final ValueChanged<DocumentType> onRequestDocument;

  const ForYouSection({
    super.key,
    required this.recommendedDocuments,
    required this.documentTypes,
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
            color: Color(0xFF1A2E1F),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          ageGroup == null
              ? 'General document recommendations'
              : 'Top documents for $ageGroup',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
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
        const SizedBox(height: 20),
        _DocumentTypesSection(
          documentTypes: documentTypes,
          status: status,
          errorMessage: errorMessage,
          onRetry: onRetry,
          onRequest: onRequestDocument,
        ),
      ],
    );
  }
}

class _DocumentTypesSection extends StatefulWidget {
  final List<DocumentType> documentTypes;
  final DocumentTypesStatus status;
  final String? errorMessage;
  final VoidCallback onRetry;
  final ValueChanged<DocumentType> onRequest;

  const _DocumentTypesSection({
    required this.documentTypes,
    required this.status,
    required this.errorMessage,
    required this.onRetry,
    required this.onRequest,
  });

  @override
  State<_DocumentTypesSection> createState() => _DocumentTypesSectionState();
}

class _DocumentTypesSectionState extends State<_DocumentTypesSection> {
  static const _pageSize = 3;
  int _currentPage = 0;

  @override
  void didUpdateWidget(covariant _DocumentTypesSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    final lastPage = widget.documentTypes.isEmpty
        ? 0
        : (widget.documentTypes.length - 1) ~/ _pageSize;
    if (_currentPage > lastPage) {
      _currentPage = lastPage;
    }
  }

  @override
  Widget build(BuildContext context) {
    final pageCount = (widget.documentTypes.length / _pageSize).ceil();
    final pageDocuments = widget.documentTypes
        .skip(_currentPage * _pageSize)
        .take(_pageSize)
        .toList(growable: false);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Available Documents',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A2E1F),
          ),
        ),
        const SizedBox(height: 10),
        if (widget.status == DocumentTypesStatus.initial ||
            widget.status == DocumentTypesStatus.loading)
          const SizedBox(
            height: 110,
            child: Center(child: CircularProgressIndicator()),
          )
        else if (widget.status == DocumentTypesStatus.error)
          _FeedError(
            message: widget.errorMessage ?? 'Documents are unavailable.',
            onRetry: widget.onRetry,
          )
        else if (widget.documentTypes.isEmpty)
          const Text('No active document types are currently available.')
        else
          Column(
            children: pageDocuments
                .map(
                  (documentType) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      margin: EdgeInsets.zero,
                      child: ListTile(
                        title: Text(
                          documentType.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1A2E1F),
                          ),
                        ),
                        trailing: TextButton(
                          onPressed: () => widget.onRequest(documentType),
                          child: const Text('Request'),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(growable: false),
          ),
        if (pageCount > 1 && widget.status == DocumentTypesStatus.loaded)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton(
                onPressed: _currentPage > 0
                    ? () => setState(() => _currentPage--)
                    : null,
                child: const Text('Previous'),
              ),
              Text('${_currentPage + 1} of $pageCount'),
              TextButton(
                onPressed: _currentPage < pageCount - 1
                    ? () => setState(() => _currentPage++)
                    : null,
                child: const Text('Next'),
              ),
            ],
          ),
        if (widget.status == DocumentTypesStatus.loaded &&
            widget.errorMessage != null)
          _FeedRefreshWarning(
            message: widget.errorMessage!,
            onRetry: widget.onRetry,
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
              style: TextStyle(fontSize: 11, color: Colors.grey[700]),
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
                  color: const Color(0xFF1A6B4A).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'RECOMMENDED DOCUMENT',
                  style: TextStyle(
                    color: Color(0xFF1A6B4A),
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
                  color: Color(0xFF1A2E1F),
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
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.3,
                    color: Colors.grey[700],
                  ),
                ),
              ),
              if (documentType.processingTimeMinutes != null)
                Text(
                  'Processing: ${documentType.processingTimeMinutes} min',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFEDF0EC)),
      ),
      child: Row(
        children: [
          const Icon(Icons.campaign_outlined, color: Color(0xFF1A6B4A)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'No documents match your age eligibility yet.',
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFEDF0EC)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(message, style: TextStyle(color: Colors.grey[700])),
          ),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
