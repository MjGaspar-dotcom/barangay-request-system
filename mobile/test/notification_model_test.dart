import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/notification_model.dart';

void main() {
  test('parses Laravel paginated notification response', () {
    final notifications = AppNotification.fromApiResponse({
      'success': true,
      'data': {
        'data': [
          {
            'notification_id': 42,
            'request_id': 123,
            'type': 'request_status_changed',
            'title': 'Document Ready for Pickup',
            'message':
                'Your clearance request (BRGY-42) is ready for pickup at the barangay office.',
            'is_read': false,
            'created_at': '2026-11-12T10:00:00.000000Z',
          },
        ],
        'current_page': 1,
      },
    });

    expect(notifications, hasLength(1));
    expect(notifications.first.id, 42);
    expect(notifications.first.title, 'Document Ready for Pickup');
    expect(notifications.first.requestId, 123);
    expect(notifications.first.isReadyForPickup, isTrue);
    expect(notifications.first.isRead, isFalse);
  });

  test('rejects unexpected notification response shape', () {
    expect(
      () => AppNotification.fromApiResponse({'success': true, 'data': {}}),
      throwsFormatException,
    );
  });

  test('orders notifications newest first when the API returns another order',
      () {
    final notifications = AppNotification.fromApiResponse({
      'data': [
        {
          'id': 42,
          'title': 'Older',
          'message': 'Older notification',
          'created_at': '2026-11-12T10:00:00Z',
        },
        {
          'id': 43,
          'title': 'Newer',
          'message': 'Newer notification',
          'created_at': '2026-11-15T10:00:00Z',
        },
        {
          'id': 44,
          'title': 'No date',
          'message': 'Unknown date',
        },
      ],
    });

    expect(
      notifications.map((notification) => notification.title).toList(),
      ['Newer', 'Older', 'No date'],
    );
  });

  test('copying a notification as read preserves its content', () {
    final notification = AppNotification(
      id: 42,
      title: 'Request update',
      message: 'Your request is ready.',
      isRead: false,
      createdAt: '2026-11-12T10:00:00.000000Z',
      type: 'request_status_changed',
      requestId: 123,
    );

    final readNotification = notification.copyWith(isRead: true);

    expect(readNotification.isRead, isTrue);
    expect(readNotification.id, notification.id);
    expect(readNotification.title, notification.title);
    expect(readNotification.message, notification.message);
    expect(readNotification.createdAt, notification.createdAt);
    expect(readNotification.type, notification.type);
    expect(readNotification.requestId, notification.requestId);
    expect(notification.isRead, isFalse);
  });
}
