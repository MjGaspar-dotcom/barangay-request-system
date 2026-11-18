import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/ui/widgets/for_you_section.dart';

void main() {
  testWidgets('dashboard For You section hides the available documents list',
      (tester) async {
    final recommendedDocument = DocumentType(
      id: 1,
      name: 'Recommended document',
      description: 'Details for the recommendation',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ForYouSection(
            recommendedDocuments: [recommendedDocument],
            status: DocumentTypesStatus.loaded,
            ageGroup: 'Adults',
            errorMessage: null,
            onRetry: () {},
            onRequestDocument: (_) {},
          ),
        ),
      ),
    );

    expect(find.text('For You'), findsOneWidget);
    expect(find.text('Top documents for Adults'), findsOneWidget);
    expect(find.text('Recommended document'), findsOneWidget);
    expect(find.text('Available Documents'), findsNothing);
    expect(find.text('Request'), findsOneWidget);
  });
}
