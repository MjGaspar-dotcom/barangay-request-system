class AppNotification {
  final int id;
  final String message;
  final bool isRead;
  final String createdAt;
  final String? type;

  AppNotification({
    required this.id,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.type,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? 0,
      message: json['message'] ?? '',
      isRead: json['is_read'] == true || json['read_at'] != null,
      createdAt: json['created_at'] ?? '',
      type: json['type'],
    );
  }
}
