class AppNotification {
  final int id;
  final String title;
  final String message;
  final bool isRead;
  final String createdAt;
  final String? type;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.type,
  });

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      title: title,
      message: message,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
      type: type,
    );
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: int.tryParse(
            (json['notification_id'] ?? json['id'] ?? 0).toString(),
          ) ??
          0,
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      isRead: json['is_read'] == true || json['read_at'] != null,
      createdAt: json['created_at']?.toString() ?? '',
      type: json['type']?.toString(),
    );
  }

  bool get isReadyForPickup {
    final normalizedTitle = title.toLowerCase();
    final normalizedMessage = message.toLowerCase();
    return type == 'request_status_changed' &&
        (normalizedTitle.contains('ready for pickup') ||
            normalizedMessage.contains('ready for pickup'));
  }

  static List<AppNotification> fromApiResponse(dynamic response) {
    dynamic payload = response;
    if (payload is Map && payload.containsKey('data')) {
      payload = payload['data'];
    } else if (payload is Map && payload.containsKey('notifications')) {
      payload = payload['notifications'];
    }

    if (payload is Map && payload.containsKey('data')) {
      payload = payload['data'];
    }
    if (payload is Map && payload.containsKey('notifications')) {
      payload = payload['notifications'];
    }
    if (payload is! List) {
      throw const FormatException('Invalid notifications response.');
    }

    return payload.map((item) {
      if (item is! Map) {
        throw const FormatException('Invalid notification item.');
      }
      return AppNotification.fromJson(Map<String, dynamic>.from(item));
    }).toList();
  }
}
