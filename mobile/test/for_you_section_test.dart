import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/request_model.dart';
import 'package:barangay_mobile/core/providers/request_provider.dart';
import 'package:barangay_mobile/ui/widgets/for_you_section.dart';

void main() {
  testWidgets('available documents show names three at a time', (tester) async {
    final documents = List.generate(
      5,
      (index) => DocumentType(
        id: index + 1,
        name: 'Document ${index + 1}',
        description: 'Details for document ${index + 1}',
      ),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: ForYouSection(
              recommendedDocuments: const [],
              documentTypes: documents,
              status: DocumentTypesStatus.loaded,
              ageGroup: 'Adults',
              errorMessage: null,
              onRetry: () {},
              onRequestDocument: (_) {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('For You'), findsOneWidget);
    expect(find.text('Top documents for Adults'), findsOneWidget);
    expect(find.text('Document 1'), findsOneWidget);
    expect(find.text('Document 2'), findsOneWidget);
    expect(find.text('Document 3'), findsOneWidget);
    expect(find.text('Document 4'), findsNothing);
    expect(find.text('Details for document 1'), findsNothing);

    await tester.ensureVisible(find.text('Next'));
    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    expect(find.text('Document 1'), findsNothing);
    expect(find.text('Document 4'), findsOneWidget);
    expect(find.text('Document 5'), findsOneWidget);
    expect(find.text('2 of 2'), findsOneWidget);

    await tester.ensureVisible(find.text('Previous'));
    await tester.tap(find.text('Previous'));
    await tester.pumpAndSettle();

    expect(find.text('Document 1'), findsOneWidget);
    expect(find.text('Document 4'), findsNothing);
  });
}
