import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/auth_provider.dart';
import 'package:barangay_mobile/core/services/api_service.dart';

void main() {
  test('parses admin-managed document catalog records', () {
    final documentType = DocumentType.fromJson({
      'document_type_id': 9,
      'document_name': 'Certificate of Unemployment',
      'description': 'Proof of unemployment',
      'processing_time_minutes': 15,
      'min_age': 18,
      'max_age': 30,
      'is_active': 1,
    });

    expect(documentType.id, 9);
    expect(documentType.name, 'Certificate of Unemployment');
    expect(documentType.description, 'Proof of unemployment');
    expect(documentType.processingTimeMinutes, 15);
    expect(documentType.minAge, 18);
    expect(documentType.maxAge, 30);
    expect(documentType.isEligibleForAge(24), isTrue);
    expect(documentType.isEligibleForAge(31), isFalse);
    expect(documentType.isEligibleForAge(null), isFalse);
    expect(documentType.isActive, isTrue);

    expect(
      DocumentType.fromJson({
        'document_type_id': 10,
        'document_name': 'Inactive type',
        'is_active': 0,
      }).isActive,
      isFalse,
    );
  });

  test('documents without age limits are general recommendations', () {
    final documentType = DocumentType(id: 1, name: 'Barangay Clearance');

    expect(documentType.isEligibleForAge(null), isTrue);
    expect(documentType.isEligibleForAge(16), isTrue);
    expect(documentType.isEligibleForAge(60), isTrue);
  });

  test('resolves stored profile image paths against the API host', () {
    expect(
      ApiService.storageUrl('resident-valid-ids/front.jpg'),
      'http://127.0.0.1:8000/storage/resident-valid-ids/front.jpg',
    );
    expect(
      ApiService.storageUrl(
        'https://files.example.test/storage/profile.jpg',
      ),
      'https://files.example.test/storage/profile.jpg',
    );
  });

  test('applies the successful profile update response without another fetch',
      () {
    final provider = AuthProvider();
    provider.applyProfileUpdate({
      'success': true,
      'data': {
        'id': 5,
        'username': 'resident',
        'first_name': 'Test',
        'last_name': 'Resident',
        'email': 'resident@example.test',
        'valid_id_front': 'resident-valid-ids/front.jpg',
      },
    });

    expect(provider.user?.validIdFront, 'resident-valid-ids/front.jpg');
    expect(provider.errorMessage, isNull);
    provider.dispose();
  });

  test('reports actionable API connection errors', () {
    final error = DioException(
      requestOptions: RequestOptions(path: '/user'),
      type: DioExceptionType.connectionError,
    );

    expect(
      ApiService.errorMessage(error),
      'Cannot reach the server. Check that the API is running.',
    );
  });
}
