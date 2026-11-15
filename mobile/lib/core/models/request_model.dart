class DocumentType {
  final int id;
  final String name;
  final String? description;
  final double? fee;
  final int? processingTimeMinutes;
  final int? minAge;
  final int? maxAge;
  final bool isActive;

  DocumentType({
    required this.id,
    required this.name,
    this.description,
    this.fee,
    this.processingTimeMinutes,
    this.minAge,
    this.maxAge,
    this.isActive = true,
  });

  bool isEligibleForAge(int? age) {
    if (age == null) return minAge == null && maxAge == null;
    return (minAge == null || age >= minAge!) &&
        (maxAge == null || age <= maxAge!);
  }

  factory DocumentType.fromJson(Map<String, dynamic> json) {
    final active = json['is_active'];
    final rawId = json['id'] ?? json['document_type_id'];
    final rawName = json['name'] ?? json['document_name'];
    return DocumentType(
      id: int.tryParse(rawId?.toString() ?? '') ?? 0,
      name: rawName?.toString() ?? '',
      description: json['description']?.toString(),
      fee: json['fee'] != null ? double.tryParse(json['fee'].toString()) : null,
      processingTimeMinutes: int.tryParse(
        json['processing_time_minutes']?.toString() ?? '',
      ),
      minAge: int.tryParse(json['min_age']?.toString() ?? ''),
      maxAge: int.tryParse(json['max_age']?.toString() ?? ''),
      isActive: active == null ||
          active == true ||
          active == 1 ||
          active.toString() == '1' ||
          active.toString().toLowerCase() == 'true',
    );
  }
}

class BarangayRequest {
  final int id;
  final String status;
  final String? remarks;
  final String? trackingNumber;
  final String createdAt;
  final String? updatedAt;
  final DocumentType? documentType;
  final String purpose;

  BarangayRequest({
    required this.id,
    required this.status,
    this.remarks,
    this.trackingNumber,
    required this.createdAt,
    this.updatedAt,
    this.documentType,
    required this.purpose,
  });

  factory BarangayRequest.fromJson(Map<String, dynamic> json) {
    return BarangayRequest(
      id: json['id'] ?? 0,
      status: json['status'] ?? 'pending',
      remarks: json['remarks'],
      trackingNumber: json['tracking_number'],
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'],
      documentType: json['document_type'] != null
          ? DocumentType.fromJson(json['document_type'])
          : null,
      purpose: json['purpose'] ?? '',
    );
  }
}

class TrackResult {
  final String status;
  final String? remarks;
  final String? documentTypeName;
  final String? requestType; // 'registered' | 'guest'
  final String? trackingNumber;
  final String? createdAt;

  TrackResult({
    required this.status,
    this.remarks,
    this.documentTypeName,
    this.requestType,
    this.trackingNumber,
    this.createdAt,
  });

  factory TrackResult.fromJson(Map<String, dynamic> json) {
    final rawDocumentType = json['document_type'];
    final documentTypeName = rawDocumentType is Map
        ? rawDocumentType['name']?.toString()
        : rawDocumentType?.toString() ?? json['document_type_name']?.toString();

    return TrackResult(
      status: json['status']?.toString() ?? 'unknown',
      remarks: json['remarks']?.toString(),
      documentTypeName: documentTypeName,
      requestType: json['request_type']?.toString(),
      trackingNumber: json['tracking_number']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}
