import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/providers/notification_provider.dart';
import 'package:barangay_mobile/core/services/api_service.dart';

void main() {
  test('dismissed notifications stay hidden after a refresh', () async {
    final provider = NotificationProvider();
    final dio = ApiService.dio;
    final originalInterceptors = List<Interceptor>.of(dio.interceptors);
    final notificationResponse = {
      'success': true,
      'data': [
        {
          'id': 42,
          'type': 'request_status_changed',
          'title': 'Document Ready for Pickup',
          'message': 'Your document is ready for pickup.',
          'is_read': false,
          'created_at': '2026-11-12T10:00:00Z',
        },
      ],
    };

    dio.interceptors
      ..clear()
      ..add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: notificationResponse,
              ),
            );
          },
        ),
      );

    addTearDown(() {
      dio.interceptors
        ..clear()
        ..addAll(originalInterceptors);
      provider.dispose();
    });

    await provider.fetch();
    expect(provider.notifications, hasLength(1));

    final notification = provider.notifications.single;
    await provider.dismiss(notification);
    expect(provider.notifications, isEmpty);

    await provider.fetch();
    expect(provider.notifications, isEmpty);

    provider.resetForSession();
    await provider.fetch();
    expect(provider.notifications, hasLength(1));
  });
}
