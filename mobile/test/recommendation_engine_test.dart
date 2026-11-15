import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/user_model.dart';
import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/services/min_heap.dart';
import 'package:barangay_mobile/core/services/recommendation_engine.dart';

void main() {
  final documentTypes = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Certificate of Indigency',
    'Barangay Business Clearance',
    'Certificate of First-Time Job Seeker',
    'Certificate of Good Moral Character',
  ]
      .asMap()
      .entries
      .map(
        (entry) => DocumentType(
          id: entry.key + 1,
          name: entry.value,
        ),
      )
      .toList();

  group('MinHeap', () {
    test('extracts values in ascending order', () {
      final heap = MinHeap<int>((first, second) => first.compareTo(second));
      heap.insert(5);
      heap.insert(1);
      heap.insert(3);

      expect(heap.size, 3);
      expect(heap.peek(), 1);
      expect(heap.extractMin(), 1);
      expect(heap.extractMin(), 3);
      expect(heap.extractMin(), 5);
      expect(heap.extractMin(), isNull);
    });
  });

  group('RecommendationEngine', () {
    final engine = RecommendationEngine();

    test('returns active catalog documents for a cold-start resident', () {
      final recommendations = engine.recommend(
        resident: _resident(id: 1),
        residents: const [],
        documentTypes: documentTypes,
      );

      expect(
        recommendations.map((item) => item.documentType).toList(),
        [
          'Barangay Clearance',
          'Certificate of Residency',
          'Certificate of Indigency',
        ],
      );
      expect(recommendations, hasLength(3));
      expect(recommendations.every((item) => item.reason.isNotEmpty), isTrue);
    });

    test('uses newly administered document types and ignores inactive types',
        () {
      final recommendations = engine.recommend(
        resident: _resident(id: 1),
        residents: const [],
        documentTypes: [
          DocumentType(id: 100, name: 'New Admin Document'),
          DocumentType(
              id: 101, name: 'Inactive Admin Document', isActive: false),
        ],
      );

      expect(
        recommendations.map((item) => item.documentType).toList(),
        ['New Admin Document'],
      );
    });

    test('returns only documents eligible for the resident age, up to three',
        () {
      final today = DateTime.now();
      final resident = _resident(
        id: 8,
        birthDate:
            DateTime(today.year - 20, today.month, today.day).toIso8601String(),
      );
      final recommendations = engine.recommend(
        resident: resident,
        residents: const [],
        documentTypes: [
          DocumentType(
            id: 1,
            name: 'Young Adult Document',
            minAge: 18,
            maxAge: 24,
          ),
          DocumentType(
            id: 2,
            name: 'Adult Document',
            minAge: 25,
            maxAge: 34,
          ),
          DocumentType(id: 3, name: 'General Document One'),
          DocumentType(id: 4, name: 'General Document Two'),
          DocumentType(id: 5, name: 'General Document Three'),
        ],
      );

      expect(recommendations, hasLength(3));
      expect(
        recommendations.map((item) => item.documentType),
        isNot(contains('Adult Document')),
      );
    });

    test('returns general documents when birth date is missing', () {
      final recommendations = engine.recommend(
        resident: _resident(id: 9),
        residents: const [],
        documentTypes: [
          DocumentType(
            id: 1,
            name: 'Age Restricted Document',
            minAge: 18,
          ),
          DocumentType(id: 2, name: 'General Document'),
        ],
      );

      expect(
        recommendations.map((item) => item.documentType),
        ['General Document'],
      );
    });

    test('different employment profiles produce different top documents', () {
      final studentRecommendations = engine.recommend(
        resident: _resident(id: 2, employmentStatus: 'student'),
        residents: const [],
        documentTypes: documentTypes,
      );
      final employedRecommendations = engine.recommend(
        resident: _resident(id: 3, employmentStatus: 'employed'),
        residents: const [],
        documentTypes: documentTypes,
      );

      expect(
        studentRecommendations.first.documentType,
        'Certificate of Good Moral Character',
      );
      expect(
        studentRecommendations.first.reason,
        'Based on your student status',
      );
      expect(
        employedRecommendations.first.documentType,
        'Barangay Clearance',
      );
      expect(
        employedRecommendations.first.reason,
        'Based on your employment status',
      );
    });
  });
}

// Create a resident with no request history unless a test provides profile data.
AppUser _resident({
  required int id,
  String? employmentStatus,
  String? birthDate,
}) {
  return AppUser(
    id: id,
    username: 'resident$id',
    firstName: 'Test',
    lastName: 'Resident',
    email: 'resident$id@example.test',
    employmentStatus: employmentStatus,
    birthDate: birthDate,
  );
}
