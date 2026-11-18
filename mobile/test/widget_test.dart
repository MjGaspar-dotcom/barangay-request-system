import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:barangay_mobile/core/providers/auth_provider.dart';
import 'package:barangay_mobile/main.dart';
import 'package:barangay_mobile/ui/screens/landing_screen.dart';
import 'package:barangay_mobile/ui/screens/auth/login_screen.dart';
import 'package:barangay_mobile/ui/screens/auth/register_screen.dart';

void main() {
  testWidgets('startup failure is shown instead of a blank screen',
      (WidgetTester tester) async {
    final startup = Completer<void>();
    await tester.pumpWidget(
      BarangayApp(startup: startup.future),
    );
    startup.completeError(StateError('preferences unavailable'));
    await tester.pump();

    expect(find.text('Unable to start Barangay Mobile'), findsOneWidget);
    expect(find.textContaining('preferences unavailable'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('landing screen offers guest access and request tracking',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: LandingScreen()),
    );
    await tester.pumpAndSettle();

    expect(find.byType(Image), findsOneWidget);
    expect(find.byKey(const Key('btn_guest_request')), findsNothing);
    expect(find.byKey(const Key('btn_continue_as_guest')), findsOneWidget);
    expect(find.text('Track an Existing Request'), findsOneWidget);
    expect(find.text("Don't have an account? Register"), findsNothing);
  });

  testWidgets('landing guest option opens guest request and tracking choices',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: LandingScreen()),
    );

    await tester.tap(find.byKey(const Key('btn_continue_as_guest')));
    await tester.pumpAndSettle();

    expect(find.text('No account is needed'), findsOneWidget);
    expect(find.byKey(const Key('btn_guest_request')), findsOneWidget);
    expect(find.byKey(const Key('btn_guest_track_request')), findsOneWidget);
  });

  testWidgets('login screen shows the unconfigured Google sign-in option',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.text('Continue with Google'), findsOneWidget);
    await tester.tap(find.byKey(const Key('btn_continue_with_google')));
    await tester.pump();

    expect(
      find.textContaining('GOOGLE_WEB_CLIENT_ID'),
      findsOneWidget,
    );
  });

  testWidgets('guest access is not shown on the resident login screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.byKey(const Key('btn_continue_as_guest')), findsNothing);
    expect(find.text("Don't have an account? Register"), findsOneWidget);
  });

  testWidgets('registration screen shows the Google sign-in option',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: RegisterScreen()),
      ),
    );

    expect(find.text('Continue with Google'), findsOneWidget);
    expect(find.byKey(const Key('btn_register_with_google')), findsOneWidget);
  });

  testWidgets('registration requires account details before advancing',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: RegisterScreen()),
      ),
    );

    final nextButton = find.byKey(const Key('btn_register_next')).first;
    await tester.ensureVisible(nextButton);
    await tester.tap(nextButton);
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 2'), findsOneWidget);
    expect(find.text('Required'), findsOneWidget);
    expect(find.text('Valid email required'), findsOneWidget);
  });

  testWidgets('registration rejects passwords shorter than eight characters',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(home: RegisterScreen()),
      ),
    );

    expect(find.text('At least 8 characters'), findsNothing);

    await tester.enterText(find.byKey(const Key('reg_username')), 'resident');
    await tester.enterText(
        find.byKey(const Key('reg_email')), 'resident@example.com');
    await tester.enterText(find.byKey(const Key('reg_password')), '1234567');
    await tester.enterText(
        find.byKey(const Key('reg_confirm_password')), '1234567');

    final nextButton = find.byKey(const Key('btn_register_next')).first;
    await tester.ensureVisible(nextButton);
    await tester.tap(nextButton);
    await tester.pumpAndSettle();

    expect(find.text('Step 1 of 2'), findsOneWidget);
    expect(find.text('Password must be at least 8 characters'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('reg_password')), '12345678');
    await tester.enterText(
        find.byKey(const Key('reg_confirm_password')), '12345678');
    await tester.ensureVisible(nextButton);
    await tester.tap(nextButton);
    await tester.pumpAndSettle();

    expect(find.text('Step 2 of 2'), findsOneWidget);
  });

  testWidgets('registration name fields stack on narrow mobile screens',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(
          home: RegisterScreen(
            googleIdToken: 'google-id-token',
            googleEmail: 'resident@example.com',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final firstName = tester.getRect(find.byKey(const Key('reg_first_name')));
    final lastName = tester.getRect(find.byKey(const Key('reg_last_name')));

    expect(tester.takeException(), isNull);
    expect(lastName.top, greaterThan(firstName.bottom));
  });

  testWidgets('Google registration skips password account fields',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(
          home: RegisterScreen(
            googleIdToken: 'google-id-token',
            googleEmail: 'resident@example.com',
            googleFirstName: 'Test',
            googleLastName: 'Resident',
          ),
        ),
      ),
    );

    expect(find.text('Google account connected'), findsOneWidget);
    expect(find.text('resident@example.com'), findsOneWidget);
    expect(find.byKey(const Key('reg_password')), findsNothing);
    expect(find.byKey(const Key('reg_birth_date')), findsOneWidget);
    expect(find.byKey(const Key('reg_middle_name')), findsOneWidget);
    expect(find.text('I have no Middle name'), findsOneWidget);

    await tester.tap(find.byKey(const Key('reg_no_middle_name')));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextFormField>(find.byKey(const Key('reg_middle_name')))
          .enabled,
      isFalse,
    );

    await tester.tap(find.byKey(const Key('reg_no_middle_name')));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<TextFormField>(find.byKey(const Key('reg_middle_name')))
          .enabled,
      isTrue,
    );
  });

  testWidgets('registration collects address components with fixed locality',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AuthProvider(),
        child: const MaterialApp(
          home: RegisterScreen(
            googleIdToken: 'google-id-token',
            googleEmail: 'resident@example.com',
          ),
        ),
      ),
    );

    expect(find.byKey(const Key('reg_street_name')), findsOneWidget);
    expect(find.byKey(const Key('reg_barangay_name')), findsOneWidget);

    final barangayName = tester
        .widget<TextFormField>(find.byKey(const Key('reg_barangay_name')));
    final municipality =
        tester.widget<TextFormField>(find.byKey(const Key('reg_municipality')));
    final province =
        tester.widget<TextFormField>(find.byKey(const Key('reg_province')));
    final postalCode =
        tester.widget<TextFormField>(find.byKey(const Key('reg_postal_code')));

    expect(barangayName.controller?.text, 'Barangay Aurora');
    expect(municipality.controller?.text, 'Alicia');
    expect(province.controller?.text, 'Isabela');
    expect(postalCode.controller?.text, '3306');
    final streetEditableText = tester.widget<EditableText>(
      find.descendant(
        of: find.byKey(const Key('reg_street_name')),
        matching: find.byType(EditableText),
      ),
    );
    expect(streetEditableText.readOnly, isFalse);
    for (final key in [
      const Key('reg_barangay_name'),
      const Key('reg_municipality'),
      const Key('reg_province'),
      const Key('reg_postal_code'),
    ]) {
      final editableText = tester.widget<EditableText>(
        find.descendant(
          of: find.byKey(key),
          matching: find.byType(EditableText),
        ),
      );
      expect(editableText.readOnly, isTrue);
    }
  });
}
