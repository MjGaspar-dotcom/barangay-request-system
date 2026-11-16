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

  test('parses request IDs, status, and receipt SVG from the API', () {
    final request = BarangayRequest.fromJson({
      'request_id': 42,
      'tracking_number': 'BR-20261115-ABC123',
      'status': 'request_submitted',
      'purpose': 'Employment requirement',
      'created_at': '2026-11-15T10:00:00Z',
      'qr_code': '<svg></svg>',
      'document_type': {
        'document_type_id': 2,
        'document_name': 'Certificate of Residency',
      },
    });

    expect(request.id, 42);
    expect(request.status, 'request_submitted');
    expect(request.trackingNumber, 'BR-20261115-ABC123');
    expect(request.qrCodeSvg, '<svg></svg>');
    expect(request.documentType?.name, 'Certificate of Residency');
  });

  test('sorts requests newest first with invalid dates last', () {
    final requests = [
      BarangayRequest(
        id: 8,
        status: 'request_submitted',
        createdAt: '2026-11-12T10:00:00Z',
        purpose: 'Older',
      ),
      BarangayRequest(
        id: 9,
        status: 'request_submitted',
        createdAt: '2026-11-15T10:00:00Z',
        purpose: 'Newer',
      ),
      BarangayRequest(
        id: 10,
        status: 'request_submitted',
        createdAt: '',
        purpose: 'Unknown date',
      ),
    ]..sort(BarangayRequest.compareNewestFirst);

    expect(requests.map((request) => request.purpose).toList(),
        ['Newer', 'Older', 'Unknown date']);
  });

  test('maps public tracking response timestamps and rejection details', () {
    final result = TrackResult.fromJson({
      'tracking_number': 'BR-20261115-ABC123',
      'status': 'rejected',
      'document_type': 'Barangay Clearance',
      'submitted_at': '2026-11-15T10:00:00Z',
      'decision_at': '2026-11-15T11:00:00Z',
      'rejection_reason': 'Missing proof of residency',
      'rejection_other': 'Please upload a current bill.',
    });

    expect(result.createdAt, '2026-11-15T10:00:00Z');
    expect(result.decisionAt, '2026-11-15T11:00:00Z');
    expect(result.documentTypeName, 'Barangay Clearance');
    expect(result.rejectionReason, 'Missing proof of residency');
    expect(result.rejectionOther, 'Please upload a current bill.');
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

  test('surfaces duplicate request validation from the backend', () {
    final error = DioException(
      requestOptions: RequestOptions(path: '/barangay-requests'),
      response: Response(
        requestOptions: RequestOptions(path: '/barangay-requests'),
        statusCode: 422,
        data: {
          'message': 'The given data was invalid.',
          'errors': {
            'document_type_id': [
              'You already have an active request for this document.',
            ],
          },
        },
      ),
      type: DioExceptionType.badResponse,
    );

    expect(
      ApiService.errorMessage(error),
      'You already have an active request for this document.',
    );
  });
}
