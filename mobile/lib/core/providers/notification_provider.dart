import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  List<AppNotification> _notifications = [];
  bool _loading = false;

  List<AppNotification> get notifications => _notifications;
  bool get loading => _loading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  Future<void> fetch() async {
    _loading = true;
    notifyListeners();
    try {
      final response = await ApiService.getNotifications();
      final List raw = response.data is List
          ? response.data
          : (response.data['data'] ?? response.data['notifications'] ?? []);
      _notifications = raw.map((e) => AppNotification.fromJson(e)).toList();
    } on DioException catch (_) {
      // Silently fail for notifications
    }
    _loading = false;
    notifyListeners();
  }
}
