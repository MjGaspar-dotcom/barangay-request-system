import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import 'package:barangay_mobile/core/models/notification_model.dart';
import 'package:barangay_mobile/core/models/generated_document.dart';
import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/notification_provider.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/core/services/api_service.dart';
import 'package:barangay_mobile/ui/screens/notifications/notifications_screen.dart';
import 'package:barangay_mobile/ui/widgets/qr_receipt_dialog.dart';

class _ReadyNotificationProvider extends NotificationProvider {
  final AppNotification notification = AppNotification(
    id: 8,
    title: 'Document Ready for Pickup',
    message: 'Your clearance is ready for pickup.',
    isRead: false,
    createdAt: '2026-11-16T10:00:00Z',
    type: 'request_status_changed',
    requestId: 123,
  );
  bool wasMarkedRead = false;

  @override
  List<AppNotification> get notifications => [notification];

  @override
  int get unreadCount => wasMarkedRead ? 0 : 1;

  @override
  Future<AppNotification?> fetch() async => null;

  @override
  Future<bool> markAsRead(AppNotification notification) async {
    wasMarkedRead = true;
    return true;
  }
}

class _PreviewRequestProvider extends RequestProvider {
  @override
  List<BarangayRequest> get requests => [
        BarangayRequest(
          id: 123,
          status: 'ready_for_pickup',
          createdAt: '2026-11-16T10:00:00Z',
          purpose: 'School enrollment',
          documentType: DocumentType(id: 1, name: 'Barangay Clearance'),
        ),
      ];
}

void main() {
  group('GeneratedDocument', () {
    test('parses generated PDF metadata and builds a safe filename', () {
      final document = GeneratedDocument.fromApiResponse({
        'success': true,
        'data': {
          'is_pdf': true,
          'document': {'resident_name': 'Test Resident'},
          'generated_document': {
            'generated_document_id': 7,
            'version_number': 2,
            'document_number': 'BRG/2026/0042',
            'generated_at': '2026-11-15T12:00:00Z',
          },
        },
      });

      expect(document.isPdf, isTrue);
      expect(document.documentData['resident_name'], 'Test Resident');
      expect(document.versionNumber, 2);
      expect(document.fileName, 'BRG_2026_0042.pdf');
    });

    test('parses server document data when there is no PDF file', () {
      final document = GeneratedDocument.fromApiResponse({
        'success': true,
        'data': {
          'document': {
            'document_number': 'BRG-42',
            'resident_name': 'Test Resident',
          },
        },
      });

      expect(document.isPdf, isFalse);
      expect(document.documentNumber, 'BRG-42');
      expect(document.documentData['resident_name'], 'Test Resident');
    });

    test('rejects a response without document data', () {
      expect(
        () => GeneratedDocument.fromApiResponse({
          'success': true,
          'data': <String, dynamic>{},
        }),
        throwsFormatException,
      );
    });
  });

  testWidgets('QR receipt displays the generated tracking QR', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: QrReceiptDialog(
            trackingNumber: 'BR-20261115-ABC123',
          ),
        ),
      ),
    );

    expect(find.text('BR-20261115-ABC123'), findsOneWidget);
    expect(
      find.text('Upload this QR code in the app to track your request.'),
      findsOneWidget,
    );
    expect(find.byType(SvgPicture), findsOneWidget);
    expect(find.byKey(const Key('download_qr_button')), findsOneWidget);
    expect(find.text('Download QR image'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('ready notification opens its generated document preview',
      (tester) async {
    final notificationProvider = _ReadyNotificationProvider();
    final requestProvider = _PreviewRequestProvider();
    final dio = ApiService.dio;
    final originalInterceptors = List<Interceptor>.of(dio.interceptors);
    final requestedPaths = <String>[];
    dio.interceptors
      ..clear()
      ..add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            requestedPaths.add(options.path);
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'success': true,
                  'data': {
                    'is_pdf': false,
                    'document': {
                      'document_number': 'BRG-123',
                      'resident_name': 'Test Resident',
                    },
                    'generated_document': {
                      'document_number': 'BRG-123',
                    },
                  },
                },
              ),
            );
          },
        ),
      );
    addTearDown(() {
      dio.interceptors
        ..clear()
        ..addAll(originalInterceptors);
      notificationProvider.dispose();
      requestProvider.dispose();
    });

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<NotificationProvider>.value(
            value: notificationProvider,
          ),
          ChangeNotifierProvider<RequestProvider>.value(
            value: requestProvider,
          ),
        ],
        child: const MaterialApp(home: NotificationsScreen()),
      ),
    );

    await tester.tap(find.text('Document Ready for Pickup'));
    await tester.pumpAndSettle();

    expect(notificationProvider.wasMarkedRead, isTrue);
    expect(
      requestedPaths,
      contains('/barangay-requests/123/generated-document'),
    );
    expect(find.text('Barangay Clearance'), findsWidgets);
    expect(find.text('Test Resident'), findsOneWidget);
  });
}
