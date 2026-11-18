import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/ui/screens/requests/my_requests_screen.dart';

class _LoadedRequestProvider extends RequestProvider {
  @override
  RequestStatus get status => RequestStatus.loaded;

  @override
  List<BarangayRequest> get requests => [
        BarangayRequest(
          id: 1,
          status: 'ready_for_pickup',
          trackingNumber: 'BR-READY',
          createdAt: '2026-11-17T10:00:00Z',
          purpose: 'School enrollment',
          documentType: DocumentType(id: 1, name: 'Barangay Clearance'),
        ),
        BarangayRequest(
          id: 2,
          status: 'completed',
          trackingNumber: 'BR-COMPLETED',
          createdAt: '2026-11-16T10:00:00Z',
          purpose: 'Personal use',
          documentType: DocumentType(id: 2, name: 'Certificate of Residency'),
        ),
      ];

  @override
  Future<void> fetchMyRequests({bool silent = false}) async {}
}

void main() {
  testWidgets('my requests no longer offers generated documents',
      (tester) async {
    final provider = _LoadedRequestProvider();
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      ChangeNotifierProvider<RequestProvider>.value(
        value: provider,
        child: const MaterialApp(home: MyRequestsScreen()),
      ),
    );
    await tester.pump();

    expect(find.text('Barangay Clearance'), findsOneWidget);
    expect(find.text('Certificate of Residency'), findsOneWidget);
    expect(find.text('Generated document'), findsNothing);
    expect(find.text('Track'), findsNWidgets(2));
  });
}
