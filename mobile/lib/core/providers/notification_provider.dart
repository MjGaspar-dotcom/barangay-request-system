import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

import '../models/notification_model.dart';
import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  List<AppNotification> _notifications = [];
  final Set<int> _dismissedNotificationIds = {};
  bool _loading = false;
  bool _hasFetched = false;
  String? _errorMessage;

  List<AppNotification> get notifications => _notifications;
  bool get loading => _loading;
  String? get errorMessage => _errorMessage;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void resetForSession() {
    _notifications = [];
    _dismissedNotificationIds.clear();
    _hasFetched = false;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> dismiss(AppNotification notification) async {
    _dismissedNotificationIds.add(notification.id);
    _notifications = _notifications
        .where((item) => item.id != notification.id)
        .toList(growable: false);
    notifyListeners();

    if (notification.isRead) return;
    try {
      await ApiService.markNotificationAsRead(notification.id);
      _errorMessage = null;
    } on DioException catch (error) {
      _errorMessage = ApiService.errorMessage(error);
      notifyListeners();
    }
  }

  Future<bool> markAsRead(AppNotification notification) async {
    final index =
        _notifications.indexWhere((item) => item.id == notification.id);
    if (index < 0 || _notifications[index].isRead) return true;

    try {
      await ApiService.markNotificationAsRead(notification.id);
      final updatedNotifications = List<AppNotification>.of(_notifications);
      updatedNotifications[index] =
          updatedNotifications[index].copyWith(isRead: true);
      _notifications = updatedNotifications;
      _errorMessage = null;
      notifyListeners();
      return true;
    } on DioException catch (error) {
      _errorMessage = ApiService.errorMessage(error);
      notifyListeners();
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    if (unreadCount == 0) return true;

    try {
      await ApiService.markAllNotificationsAsRead();
      _notifications = _notifications
          .map((notification) => notification.copyWith(isRead: true))
          .toList(growable: false);
      _errorMessage = null;
      notifyListeners();
      return true;
    } on DioException catch (error) {
      _errorMessage = ApiService.errorMessage(error);
      notifyListeners();
      return false;
    }
  }

  Future<AppNotification?> fetch() async {
    if (_loading) return null;

    _loading = true;
    _errorMessage = null;
    notifyListeners();

    AppNotification? newlyReadyNotification;
    try {
      final response = await ApiService.getNotifications();
      final fetchedNotifications =
          AppNotification.fromApiResponse(response.data)
              .where((notification) =>
                  !_dismissedNotificationIds.contains(notification.id))
              .toList(growable: false);

      if (_hasFetched) {
        final knownIds =
            _notifications.map((notification) => notification.id).toSet();
        for (final notification in fetchedNotifications) {
          if (!knownIds.contains(notification.id) &&
              notification.isReadyForPickup) {
            newlyReadyNotification = notification;
            break;
          }
        }
      }

      _notifications = fetchedNotifications;
      _hasFetched = true;
    } on DioException catch (e) {
      final data = e.response?.data;
      _errorMessage = data is Map && data['message'] != null
          ? data['message'].toString()
          : 'Notifications could not be loaded. Please try again.';
    } on FormatException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = 'Notifications could not be loaded: $e';
    } finally {
      _loading = false;
      notifyListeners();
    }

    return newlyReadyNotification;
  }
}
