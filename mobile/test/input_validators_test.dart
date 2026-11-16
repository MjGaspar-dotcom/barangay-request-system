import 'package:flutter_test/flutter_test.dart';
import 'package:barangay_mobile/core/utils/input_validators.dart';

void main() {
  group('InputValidators', () {
    test('username enforces Laravel required, alpha_dash, and max rules', () {
      expect(InputValidators.username('  '), 'Required');
      expect(InputValidators.username('resident.name'), isNotNull);
      expect(InputValidators.username('resident-name_1'), isNull);
      expect(InputValidators.username('a' * 256), isNotNull);
    });

    test('email is trimmed and constrained by format and length', () {
      expect(InputValidators.email(' resident@example.org '), isNull);
      expect(InputValidators.email('residentexample.org'), isNotNull);
      expect(InputValidators.email('a' * 250 + '@x.com'), isNotNull);
      expect(InputValidators.email('', optional: true), isNull);
    });

    test('contact number keeps backend-compatible text and length rules', () {
      expect(InputValidators.contactNumber('+1 (555) 010-1234'), isNull);
      expect(InputValidators.contactNumber('x' * 21), isNotNull);
      expect(InputValidators.contactNumber('', optional: true), isNull);
    });

    test('required text rejects whitespace and excessive length', () {
      expect(InputValidators.requiredText('  ', maxLength: 255), 'Required');
      expect(InputValidators.requiredText('value', maxLength: 255), isNull);
      expect(
          InputValidators.requiredText('x' * 256, maxLength: 255), isNotNull);
    });
  });
}
