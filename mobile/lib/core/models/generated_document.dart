class GeneratedDocument {
  final int id;
  final int versionNumber;
  final String documentNumber;
  final DateTime? generatedAt;

  const GeneratedDocument({
    required this.id,
    required this.versionNumber,
    required this.documentNumber,
    this.generatedAt,
  });

  factory GeneratedDocument.fromJson(Map<String, dynamic> json) {
    return GeneratedDocument(
      id: int.tryParse(json['generated_document_id']?.toString() ?? '') ?? 0,
      versionNumber:
          int.tryParse(json['version_number']?.toString() ?? '') ?? 0,
      documentNumber: json['document_number']?.toString() ?? '',
      generatedAt: DateTime.tryParse(json['generated_at']?.toString() ?? ''),
    );
  }
}
