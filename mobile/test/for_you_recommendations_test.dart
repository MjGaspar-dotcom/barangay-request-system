import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/recommendation.dart';
import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/models/user_model.dart';
import 'package:barangay_mobile/core/services/recommendation_engine.dart';

void main() {
  final engine = RecommendationEngine();

  test('puts the most recently requested eligible document first', () {
    final oldRequest = DocumentType(id: 1, name: 'Older request');
    final latestRequest = DocumentType(id: 2, name: 'Latest request');
    final ageRecommendation = DocumentType(
      id: 3,
      name: 'Age recommendation',
      minAge: 18,
      maxAge: 34,
    );
    final nextRecommendation =
        DocumentType(id: 4, name: 'Another eligible document');

    final documents = engine.orderForYouDocuments(
      residentAge: 30,
      availableDocuments: [
        oldRequest,
        latestRequest,
        ageRecommendation,
        nextRecommendation,
      ],
      requestHistory: [
        ResidentRequest(
          documentType: oldRequest.name,
          date: DateTime(2026, 10, 1),
        ),
        ResidentRequest(
          documentType: latestRequest.name,
          date: DateTime(2026, 11, 1),
        ),
      ],
      profileRecommendations: [ageRecommendation, nextRecommendation],
    );

    expect(
      documents.map((document) => document.name).toList(),
      ['Latest request', 'Age recommendation', 'Another eligible document'],
    );
  });

  test('uses profile recommendations first before any request history exists',
      () {
    final profileRecommendations = [
      DocumentType(id: 1, name: 'Profile match'),
      DocumentType(id: 2, name: 'Age match'),
    ];

    final documents = engine.orderForYouDocuments(
      residentAge: 24,
      availableDocuments: profileRecommendations,
      requestHistory: const [],
      profileRecommendations: profileRecommendations,
    );

    expect(documents, profileRecommendations);
  });

  test('does not repeat the latest request or show it when age-ineligible', () {
    final recent = DocumentType(id: 1, name: 'Recent request');
    final ageRecommendation =
        DocumentType(id: 2, name: 'Eligible recommendation');
    final ineligibleRequest = DocumentType(
      id: 3,
      name: 'Ineligible request',
      minAge: 60,
    );

    final duplicateFree = engine.orderForYouDocuments(
      residentAge: 30,
      availableDocuments: [recent, ageRecommendation],
      requestHistory: [
        ResidentRequest(documentType: recent.name, date: DateTime(2026, 11, 1)),
      ],
      profileRecommendations: [recent, ageRecommendation],
    );
    final ageFiltered = engine.orderForYouDocuments(
      residentAge: 30,
      availableDocuments: [ineligibleRequest, ageRecommendation],
      requestHistory: [
        ResidentRequest(
          documentType: ineligibleRequest.name,
          date: DateTime(2026, 11, 1),
        ),
      ],
      profileRecommendations: [ageRecommendation],
    );

    expect(duplicateFree.map((document) => document.id), [1, 2]);
    expect(ageFiltered.map((document) => document.id), [2]);
  });

  test('profile ranking can ignore history while the latest request is placed',
      () {
    final resident = AppUser(
      id: 8,
      username: 'resident8',
      firstName: 'Test',
      lastName: 'Resident',
      email: 'resident8@example.test',
      employmentStatus: 'Employed',
      birthDate: '1995-05-01',
    );
    final documentTypes = [
      DocumentType(id: 1, name: 'Barangay Clearance'),
      DocumentType(id: 2, name: 'Certificate of First-Time Job Seeker'),
      DocumentType(id: 3, name: 'Certificate of Residency'),
    ];
    final history = [
      ResidentRequest(
        documentType: 'Certificate of Residency',
        date: DateTime(2026, 11, 1),
      ),
    ];

    final profileOnly = engine.recommend(
      resident: resident,
      residents: const [],
      documentTypes: documentTypes,
      includeRequestHistory: false,
    );
    final profileWithRecentRequest = engine.recommend(
      resident: resident,
      residents: const [],
      documentTypes: documentTypes,
      requestHistory: history,
      includeRequestHistory: false,
    );

    expect(
      profileWithRecentRequest.map((item) => item.documentType),
      profileOnly.map((item) => item.documentType),
    );
  });
}
