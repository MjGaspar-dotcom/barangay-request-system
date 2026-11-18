import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/auth_provider.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/ui/screens/requests/create_request_screen.dart';

class _DocumentRequestProvider extends RequestProvider {
  _DocumentRequestProvider({
    required List<BarangayRequest> requests,
    this.errorMessageValue,
  }) : _requests = requests;

  final List<BarangayRequest> _requests;
  final String? errorMessageValue;

  final _documentTypes = [
    DocumentType(
      id: 1,
      name: 'Barangay Business Clearance',
      processingTimeMinutes: 15,
    ),
    DocumentType(
      id: 2,
      name: 'Certificate of Residency',
      processingTimeMinutes: 30,
    ),
    DocumentType(
      id: 3,
      name: 'Certificate of Solo Parent',
      processingTimeMinutes: 45,
    ),
  ];
  Map<String, dynamic>? submittedRequestData;

  @override
  List<DocumentType> get documentTypes => _documentTypes;

  @override
  List<BarangayRequest> get requests => _requests;

  @override
  DocumentTypesStatus get documentTypesStatus => DocumentTypesStatus.loaded;

  @override
  String? get errorMessage => errorMessageValue;

  @override
  Future<void> fetchDocumentTypes({bool force = false}) async {}

  @override
  Future<bool> createRegisteredRequest({
    required int documentTypeId,
    required String purpose,
    Map<String, dynamic>? requestDetails,
  }) async {
    submittedRequestData = requestDetails;
    return false;
  }
}

void main() {
  testWidgets('guest request requires ID photos and collects guest details',
      (tester) async {
    final provider = _DocumentRequestProvider(requests: []);
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(
          home: CreateRequestScreen(guestMode: true),
        ),
      ),
    );

    expect(find.byKey(const Key('guest_first_name')), findsOneWidget);
    expect(find.byKey(const Key('guest_middle_name')), findsOneWidget);
    expect(find.byKey(const Key('guest_no_middle_name')), findsOneWidget);
    expect(find.byKey(const Key('guest_last_name')), findsOneWidget);
    expect(find.byKey(const Key('guest_birth_date')), findsOneWidget);
    expect(find.byKey(const Key('guest_contact_number')), findsOneWidget);
    expect(find.byKey(const Key('guest_street_name')), findsOneWidget);
    expect(find.text('Type of valid ID'), findsNothing);
    expect(find.byKey(const Key('btn_guest_upload_id_front')), findsOneWidget);
    expect(find.byKey(const Key('btn_guest_upload_id_back')), findsOneWidget);

    final birthdayField = find.byKey(const Key('guest_birth_date'));
    await tester.ensureVisible(birthdayField);
    await tester.tap(birthdayField);
    await tester.pumpAndSettle();
    expect(find.byType(CalendarDatePicker), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    final noMiddleNameCheckbox = find.byKey(const Key('guest_no_middle_name'));
    await tester.ensureVisible(noMiddleNameCheckbox);
    await tester.tap(noMiddleNameCheckbox);
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextFormField>(
            find.byKey(const Key('guest_middle_name')),
          )
          .enabled,
      isFalse,
    );

    final submitButton = find.byKey(const Key('btn_create_request_submit'));
    await tester.ensureVisible(submitButton);
    await tester.tap(submitButton);
    await tester.pumpAndSettle();

    expect(
      find.text('Upload both the front and back of your ID.'),
      findsOneWidget,
    );
  });

  testWidgets('business clearance reuses previous request details',
      (tester) async {
    final provider = _DocumentRequestProvider(
      requests: [
        BarangayRequest(
          id: 2,
          status: 'completed',
          createdAt: '2026-11-16T10:00:00Z',
          purpose: 'Business permit',
          documentType:
              DocumentType(id: 1, name: 'Barangay Business Clearance'),
          requestData: const {'business_name': 'Latest Shop'},
        ),
        BarangayRequest(
          id: 1,
          status: 'completed',
          createdAt: '2026-11-15T10:00:00Z',
          purpose: 'Business permit',
          documentType:
              DocumentType(id: 1, name: 'Barangay Business Clearance'),
          requestData: const {
            'business_name': 'Older Shop',
            'business_address': '12 Main Street',
            'business_activity': 'Retail bakery',
          },
        ),
      ],
    );
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Barangay Business Clearance').last);
    await tester.pumpAndSettle();

    String fieldValue(String key) =>
        tester.widget<TextFormField>(find.byKey(Key(key))).controller!.text;

    expect(fieldValue('create_req_business_name'), 'Latest Shop');
    expect(fieldValue('create_req_business_address'), '12 Main Street');
    expect(find.byKey(const Key('create_req_business_activity')), findsNothing);
    expect(
      find.text(
        'Some details were filled from your previous request. '
        'Please review them before submitting.',
      ),
      findsOneWidget,
    );

    await tester.enterText(
      find.byKey(const Key('create_req_business_name')),
      'Updated Shop',
    );
    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Certificate of Residency').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Barangay Business Clearance').last);
    await tester.pumpAndSettle();

    expect(fieldValue('create_req_business_name'), 'Updated Shop');
    await tester.tap(find.byKey(const Key('create_req_purpose')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Business permit').last);
    await tester.pumpAndSettle();
    await tester
        .ensureVisible(find.byKey(const Key('btn_create_request_submit')));
    await tester.tap(find.byKey(const Key('btn_create_request_submit')));
    await tester.pumpAndSettle();
    expect(provider.submittedRequestData, {
      'business_name': 'Updated Shop',
      'business_address': '12 Main Street',
    });

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('document type options show processing time without a label',
      (tester) async {
    final provider = _DocumentRequestProvider(requests: const []);
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();

    expect(find.text('15 min'), findsOneWidget);
    expect(find.text('30 min'), findsOneWidget);
    expect(find.text('45 min'), findsOneWidget);
    expect(find.textContaining('Processing'), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('business clearance leaves unavailable history details blank',
      (tester) async {
    final provider = _DocumentRequestProvider(requests: const []);
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Barangay Business Clearance').last);
    await tester.pumpAndSettle();

    final businessName = tester.widget<TextFormField>(
        find.byKey(const Key('create_req_business_name')));
    expect(businessName.controller!.text, isEmpty);
    expect(
      find.text(
        'Some details were filled from your previous request. '
        'Please review them before submitting.',
      ),
      findsNothing,
    );

    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('solo parent request shows and submits the child count field',
      (tester) async {
    final provider = _DocumentRequestProvider(
      requests: [
        BarangayRequest(
          id: 1,
          status: 'completed',
          createdAt: '2026-11-16T10:00:00Z',
          purpose: 'Personal use',
          documentType: DocumentType(id: 3, name: 'Certificate of Solo Parent'),
          requestData: const {'number_of_children': 2},
        ),
      ],
    );
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Certificate of Solo Parent').last);
    await tester.pumpAndSettle();

    final childCountField =
        find.byKey(const Key('create_req_number_of_children'));
    expect(childCountField, findsOneWidget);
    expect(
      tester.widget<TextFormField>(childCountField).controller!.text,
      isEmpty,
    );
    expect(
      find.text(
        'The number of children was filled from your previous request. '
        'Please review it before submitting.',
      ),
      findsNothing,
    );

    await tester.ensureVisible(find.byKey(const Key('create_req_purpose')));
    await tester.tap(find.byKey(const Key('create_req_purpose')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Personal use').last);
    await tester.pumpAndSettle();

    await tester.ensureVisible(childCountField);
    await tester.enterText(childCountField, '3');
    await tester
        .ensureVisible(find.byKey(const Key('btn_create_request_submit')));
    await tester.tap(find.byKey(const Key('btn_create_request_submit')));
    await tester.pumpAndSettle();

    expect(provider.submittedRequestData, {'number_of_children': 3});
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('solo parent request validates that the child count is entered',
      (tester) async {
    final provider = _DocumentRequestProvider(requests: const []);
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Certificate of Solo Parent').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('create_req_purpose')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Personal use').last);
    await tester.pumpAndSettle();

    await tester
        .ensureVisible(find.byKey(const Key('btn_create_request_submit')));
    await tester.tap(find.byKey(const Key('btn_create_request_submit')));
    await tester.pumpAndSettle();

    expect(find.text('Enter a whole number'), findsOneWidget);
    expect(provider.submittedRequestData, isNull);
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('request errors are shown inline instead of in a popup',
      (tester) async {
    final provider = _DocumentRequestProvider(
      requests: const [],
      errorMessageValue: 'Request could not be submitted.',
    );
    addTearDown(provider.dispose);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider<RequestProvider>.value(value: provider),
        ],
        child: const MaterialApp(home: CreateRequestScreen()),
      ),
    );

    await tester.tap(find.byKey(const Key('create_req_doc_type')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Certificate of Residency').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('create_req_purpose')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Personal use').last);
    await tester.pumpAndSettle();

    await tester
        .ensureVisible(find.byKey(const Key('btn_create_request_submit')));
    await tester.tap(find.byKey(const Key('btn_create_request_submit')));
    await tester.pumpAndSettle();

    expect(find.text('Request could not be submitted.'), findsOneWidget);
    expect(find.byType(SnackBar), findsNothing);
    expect(find.byType(Dialog), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
  });
}
