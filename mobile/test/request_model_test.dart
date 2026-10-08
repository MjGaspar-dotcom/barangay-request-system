import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/services/api_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('builds a tracking link from the configured API base URL', () {
    expect(
      ApiService.trackingUrl('GR-20261008-ABC123'),
      'http://10.0.2.2:8000/api/track/GR-20261008-ABC123',
    );
  });

  group('RequestReceipt.fromResponse', () {
    test('reads tracking details nested in the API response', () {
      final receipt = RequestReceipt.fromResponse({
        'success': true,
        'data': {
          'request': {'tracking_number': 'GR-20261008-ABC123'},
          'qr_payload': 'https://barangay.example/api/track/GR-20261008-ABC123',
        },
      });

      expect(receipt.trackingNumber, 'GR-20261008-ABC123');
      expect(
        receipt.qrPayload,
        'https://barangay.example/api/track/GR-20261008-ABC123',
      );
    });
  });

  group('TrackResult.fromJson', () {
    test('reads the backend tracking response fields', () {
      final result = TrackResult.fromJson({
        'tracking_number': 'GR-20261008-ABC123',
        'status': 'Pending',
        'document_type': 'Barangay Clearance',
        'submitted_at': '2026-10-08T10:30:00.000000Z',
        'remarks': null,
      });

      expect(result.trackingNumber, 'GR-20261008-ABC123');
      expect(result.documentTypeName, 'Barangay Clearance');
      expect(result.createdAt, '2026-10-08T10:30:00.000000Z');
    });
  });
}
