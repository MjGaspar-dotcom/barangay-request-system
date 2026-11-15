class ResidentRequest {
  final String documentType;
  final DateTime date;

  const ResidentRequest({
    required this.documentType,
    required this.date,
  });

  // Parse a mock or API request record into the shared recommendation history type.
  factory ResidentRequest.fromJson(Map<String, dynamic> json) {
    final rawDate = json['date'] ?? json['created_at'];
    return ResidentRequest(
      documentType:
          (json['documentType'] ?? json['document_type'] ?? '').toString(),
      date: rawDate is DateTime
          ? rawDate
          : DateTime.tryParse(rawDate?.toString() ?? '') ?? DateTime.now(),
    );
  }

  // Serialize the request fields for the existing resident model.
  Map<String, dynamic> toJson() => {
        'document_type': documentType,
        'date': date.toIso8601String(),
      };
}

class Recommendation {
  final String documentType;
  final double score;
  final String reason;

  const Recommendation({
    required this.documentType,
    required this.score,
    required this.reason,
  });
}
