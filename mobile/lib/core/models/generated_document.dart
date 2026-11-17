class GeneratedDocument {
  final int? id;
  final bool isPdf;
  final Map<String, dynamic> documentData;
  final String? documentNumber;
  final String? originalName;
  final int? versionNumber;
  final DateTime? generatedAt;

  const GeneratedDocument({
    this.id,
    required this.isPdf,
    required this.documentData,
    this.documentNumber,
    this.originalName,
    this.versionNumber,
    this.generatedAt,
  });

  String get fileName {
    final name = originalName?.trim();
    if (name != null && name.isNotEmpty) return name;

    final number = documentNumber?.trim();
    if (number != null && number.isNotEmpty) {
      return '${number.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_')}.pdf';
    }

    return 'barangay-document.pdf';
  }

  factory GeneratedDocument.fromJson(Map<String, dynamic> json) {
    return GeneratedDocument(
      id: int.tryParse(json['generated_document_id']?.toString() ?? ''),
      isPdf: true,
      documentData: const {},
      documentNumber: json['document_number']?.toString(),
      originalName: json['original_name']?.toString(),
      versionNumber: int.tryParse(json['version_number']?.toString() ?? ''),
      generatedAt: DateTime.tryParse(json['generated_at']?.toString() ?? ''),
    );
  }

  factory GeneratedDocument.fromApiResponse(dynamic response) {
    if (response is! Map) {
      throw const FormatException('Invalid generated document response.');
    }
    if (response['success'] == false) {
      throw FormatException(
        response['message']?.toString() ??
            'The generated document could not be loaded.',
      );
    }

    final payload = response['data'] ?? response;
    if (payload is! Map || payload['document'] is! Map) {
      throw const FormatException('Generated document data is missing.');
    }

    final metadata = payload['generated_document'];
    final document = Map<String, dynamic>.from(payload['document'] as Map);
    final metadataMap = metadata is Map
        ? Map<String, dynamic>.from(metadata)
        : <String, dynamic>{};

    return GeneratedDocument(
      id: int.tryParse(metadataMap['generated_document_id']?.toString() ?? ''),
      isPdf: payload['is_pdf'] == true,
      documentData: document,
      documentNumber:
          (metadataMap['document_number'] ?? document['document_number'])
              ?.toString(),
      originalName: metadataMap['original_name']?.toString(),
      versionNumber: int.tryParse(
        metadataMap['version_number']?.toString() ?? '',
      ),
      generatedAt: DateTime.tryParse(
        (metadataMap['generated_at'] ?? document['document_generated_at'])
                ?.toString() ??
            '',
      ),
    );
  }
}
