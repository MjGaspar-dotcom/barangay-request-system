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
  final String? qrCodeSvg;
  String? get qrCode => qrCodeSvg;
  final String createdAt;
  final String? updatedAt;
  final DocumentType? documentType;
  final String purpose;
  final bool hasGeneratedPdf;
  final Map<String, dynamic>? requestData;

  BarangayRequest({
    required this.id,
    required this.status,
    this.remarks,
    this.trackingNumber,
    String? qrCode,
    String? qrCodeSvg,
    required this.createdAt,
    this.updatedAt,
    this.documentType,
    required this.purpose,
    this.hasGeneratedPdf = false,
    this.requestData,
  }) : qrCodeSvg = qrCodeSvg ?? qrCode;

  static int compareNewestFirst(BarangayRequest a, BarangayRequest b) {
    final aCreatedAt = DateTime.tryParse(a.createdAt);
    final bCreatedAt = DateTime.tryParse(b.createdAt);
    if (aCreatedAt == null) {
      return bCreatedAt == null ? b.id.compareTo(a.id) : 1;
    }
    if (bCreatedAt == null) return -1;

    final byDate = bCreatedAt.compareTo(aCreatedAt);
    return byDate != 0 ? byDate : b.id.compareTo(a.id);
  }

  BarangayRequest copyWithQrCode(String? value) {
    return BarangayRequest(
      id: id,
      status: status,
      remarks: remarks,
      trackingNumber: trackingNumber,
      qrCodeSvg: value ?? qrCodeSvg,
      createdAt: createdAt,
      updatedAt: updatedAt,
      documentType: documentType,
      purpose: purpose,
      hasGeneratedPdf: hasGeneratedPdf,
      requestData: requestData,
    );
  }

  factory BarangayRequest.fromJson(Map<String, dynamic> json) {
    return BarangayRequest(
      id: int.tryParse(
            (json['id'] ?? json['request_id'] ?? 0).toString(),
          ) ??
          0,
      status: json['status']?.toString() ?? 'unknown',
      remarks: json['remarks']?.toString(),
      trackingNumber: json['tracking_number']?.toString(),
      qrCodeSvg: json['qr_code']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString(),
      documentType: json['document_type'] is Map
          ? DocumentType.fromJson(
              Map<String, dynamic>.from(json['document_type'] as Map),
            )
          : null,
      purpose: json['purpose']?.toString() ?? '',
      hasGeneratedPdf: json['has_generated_pdf'] == true ||
          json['has_generated_pdf']?.toString() == '1',
      requestData: json['request_data'] is Map
          ? Map<String, dynamic>.from(json['request_data'] as Map)
          : null,
    );
  }

  bool get needsBusinessDetails {
    if (documentType?.name.trim().toLowerCase() !=
            'barangay business clearance' ||
        status.toLowerCase() != 'request_submitted' ||
        hasGeneratedPdf) {
      return false;
    }

    const requiredFields = [
      'business_name',
      'business_address',
      'business_activity',
    ];
    return requiredFields.any(
      (field) => requestData?[field]?.toString().trim().isNotEmpty != true,
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
  final String? decisionAt;
  final String? rejectionReason;
  final String? rejectionOther;

  const TrackResult({
    required this.status,
    this.remarks,
    this.documentTypeName,
    this.requestType,
    this.trackingNumber,
    this.createdAt,
    this.decisionAt,
    this.rejectionReason,
    this.rejectionOther,
  });

  factory TrackResult.fromJson(Map<String, dynamic> json) {
    final rawDocumentType = json['document_type'];
    final documentTypeName = rawDocumentType is Map
        ? (rawDocumentType['name'] ?? rawDocumentType['document_name'])
            ?.toString()
        : rawDocumentType?.toString() ?? json['document_type_name']?.toString();

    return TrackResult(
      status: json['status']?.toString() ?? 'unknown',
      remarks: json['remarks']?.toString(),
      documentTypeName: documentTypeName,
      requestType: json['request_type']?.toString(),
      trackingNumber: json['tracking_number']?.toString(),
      createdAt: (json['created_at'] ?? json['submitted_at'])?.toString(),
      decisionAt: json['decision_at']?.toString(),
      rejectionReason: json['rejection_reason']?.toString(),
      rejectionOther: json['rejection_other']?.toString(),
    );
  }
}
