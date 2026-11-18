import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/models/notification_model.dart';
import 'package:barangay_mobile/core/providers/auth_provider.dart';
import 'package:barangay_mobile/core/providers/notification_provider.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/ui/screens/guest/track_request_screen.dart';
import 'package:barangay_mobile/ui/screens/home/home_screen.dart';
import 'package:barangay_mobile/ui/screens/profile/profile_screen.dart';
import 'package:barangay_mobile/ui/widgets/status_chip.dart';

class _AutoSyncRequestProvider extends RequestProvider {
  final List<bool> refreshCalls = [];

  @override
  Future<void> fetchMyRequests({bool silent = false}) async {
    refreshCalls.add(silent);
  }

  @override
  Future<void> fetchDocumentTypes({bool force = false}) async {}
}

class _IdleNotificationProvider extends NotificationProvider {
  @override
  Future<AppNotification?> fetch() async => null;
}

class _TrackingRequestProvider extends RequestProvider {
  int trackCalls = 0;
  bool? lastCallWasSilent;

  @override
  Future<bool> trackRequest(
    String trackingNumber, {
    bool silent = false,
  }) async {
    trackCalls++;
    lastCallWasSilent = silent;
    return true;
  }
}

void main() {
  testWidgets('shows the four-stage resident request lifecycle',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RequestStatusTimeline(
            result: TrackResult(
              status: 'ready_for_pickup',
              createdAt: '2026-11-15T10:00:00Z',
            ),
          ),
        ),
      ),
    );

    expect(find.text('Request Submitted'), findsOneWidget);
    expect(find.text('Processing & Approval'), findsOneWidget);
    expect(find.text('Ready for Pickup'), findsOneWidget);
    expect(find.text('Completed'), findsOneWidget);
    expect(find.text('Approved'), findsNothing);
    expect(find.text('Processing'), findsNothing);
  });

  testWidgets('uses the same processing stage for approved and processing',
      (tester) async {
    for (final status in ['approved', 'processing']) {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RequestStatusTimeline(
              result: TrackResult(status: status),
            ),
          ),
        ),
      );

      expect(find.text('Processing & Approval'), findsOneWidget);
      expect(find.text('Approved'), findsNothing);
      expect(find.text('Processing'), findsNothing);
    }
  });

  testWidgets('status chips use the four resident workflow labels',
      (tester) async {
    for (final entry in {
      'request_submitted': 'Request Submitted',
      'approved': 'Processing & Approval',
      'ready_for_pickup': 'Ready for Pickup',
      'completed': 'Completed',
    }.entries) {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: StatusChip(status: entry.key)),
        ),
      );

      expect(find.text(entry.value), findsOneWidget);
    }
  });

  testWidgets('shows rejection as a final timeline state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RequestStatusTimeline(
            result: TrackResult(status: 'rejected'),
          ),
        ),
      ),
    );

    expect(find.text('Request Submitted'), findsOneWidget);
    expect(find.text('Rejected'), findsOneWidget);
    expect(find.text('Completed'), findsNothing);
  });

  testWidgets('automatically refreshes a tracked request', (tester) async {
    final provider = _TrackingRequestProvider();
    await tester.pumpWidget(
      ChangeNotifierProvider<RequestProvider>.value(
        value: provider,
        child: const MaterialApp(
          home: TrackRequestScreen(initialTracking: 'BRG-123'),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();

    expect(provider.trackCalls, 1);
    expect(provider.lastCallWasSilent, isFalse);

    await tester.pump(const Duration(seconds: 15));
    await tester.pump();

    expect(provider.trackCalls, 2);
    expect(provider.lastCallWasSilent, isTrue);
  });

  testWidgets('automatically refreshes dashboard requests', (tester) async {
    final requestProvider = _AutoSyncRequestProvider();
    final notificationProvider = _IdleNotificationProvider();
    addTearDown(requestProvider.dispose);
    addTearDown(notificationProvider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(
            value: requestProvider,
          ),
          ChangeNotifierProvider<NotificationProvider>.value(
            value: notificationProvider,
          ),
        ],
        child: const MaterialApp(home: HomeScreen()),
      ),
    );
    await tester.pump();
    final silentRefreshCountBefore =
        requestProvider.refreshCalls.where((silent) => silent).length;

    await tester.pump(const Duration(seconds: 15));
    await tester.pump();

    expect(
      requestProvider.refreshCalls.where((silent) => silent).length,
      silentRefreshCountBefore + 1,
    );
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('dashboard does not show the settings menu', (tester) async {
    final requestProvider = _AutoSyncRequestProvider();
    final notificationProvider = _IdleNotificationProvider();
    addTearDown(requestProvider.dispose);
    addTearDown(notificationProvider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(
            value: requestProvider,
          ),
          ChangeNotifierProvider<NotificationProvider>.value(
            value: notificationProvider,
          ),
        ],
        child: const MaterialApp(home: HomeScreen()),
      ),
    );
    await tester.pump();

    expect(find.byTooltip('Settings'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('profile settings menu includes account actions', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: ProfileScreen()),
      ),
    );

    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();

    expect(find.text('Personal information'), findsOneWidget);
    expect(find.text('Change password'), findsOneWidget);
    expect(find.text('Logout'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
  });
}
