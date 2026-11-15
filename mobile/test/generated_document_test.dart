import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/generated_document.dart';

void main() {
  test('parses generated PDF metadata returned by the API', () {
    final document = GeneratedDocument.fromJson({
      'generated_document_id': 17,
      'version_number': 3,
      'document_number': 'BA-2026-000017',
      'generated_at': '2026-11-15T10:30:00Z',
    });

    expect(document.id, 17);
    expect(document.versionNumber, 3);
    expect(document.documentNumber, 'BA-2026-000017');
    expect(document.generatedAt, DateTime.parse('2026-11-15T10:30:00Z'));
  });
}