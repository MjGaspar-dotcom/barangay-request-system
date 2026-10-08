class DocumentType {
  final int id;
  final String name;
  final String? description;
  final double? fee;

  DocumentType({
    required this.id,
    required this.name,
    this.description,
    this.fee,
  });

  factory DocumentType.fromJson(Map<String, dynamic> json) {
    return DocumentType(
      id: json['id'] ?? json['document_type_id'] ?? 0,
      name: json['name'] ?? json['document_name'] ?? '',
      description: json['description'],
      fee: json['fee'] != null ? double.tryParse(json['fee'].toString()) : null,
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
    return TrackResult(
      status: json['status'] ?? 'unknown',
      remarks: json['remarks'],
      documentTypeName:
          json['document_type']?['name'] ?? json['document_type_name'],
      requestType: json['request_type'],
      trackingNumber: json['tracking_number'],
      createdAt: json['created_at'],
    );
  }
}
