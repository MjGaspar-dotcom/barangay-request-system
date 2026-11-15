import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/ui/widgets/status_chip.dart';
import 'package:flutter/material.dart';

void main() {
  test('request parsing preserves server identifiers and QR receipts', () {
    final request = BarangayRequest.fromJson({
      'request_id': 42,
      'status': 'ready_for_pickup',
      'tracking_number': 'BR-20261115-ABC123',
      'qr_code': '<svg></svg>',
      'created_at': '2026-11-15T10:00:00Z',
      'purpose': 'Employment',
      'document_type': {
        'document_type_id': 4,
        'document_name': 'Barangay Clearance',
      },
    });

    expect(request.id, 42);
    expect(request.status, 'ready_for_pickup');
    expect(request.trackingNumber, 'BR-20261115-ABC123');
    expect(request.qrCode, '<svg></svg>');
    expect(request.documentType?.name, 'Barangay Clearance');
  });

  testWidgets('status chip uses workflow statuses returned by the API',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Column(
          children: [
            StatusChip(status: 'request_submitted'),
            StatusChip(status: 'ready_for_pickup'),
          ],
        ),
      ),
    );

    expect(find.text('Submitted'), findsOneWidget);
    expect(find.text('Ready for Pickup'), findsOneWidget);
  });
}
