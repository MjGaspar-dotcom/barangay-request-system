import 'package:flutter_test/flutter_test.dart';

import 'package:barangay_mobile/core/models/age_group.dart';
import 'package:barangay_mobile/core/models/user_model.dart';

void main() {
  group('AgeGroup', () {
    test('maps every required age boundary', () {
      expect(AgeGroup.fromAge(13), AgeGroup.teenager);
      expect(AgeGroup.fromAge(17), AgeGroup.teenager);
      expect(AgeGroup.fromAge(18), AgeGroup.youngAdult);
      expect(AgeGroup.fromAge(24), AgeGroup.youngAdult);
      expect(AgeGroup.fromAge(25), AgeGroup.adult);
      expect(AgeGroup.fromAge(34), AgeGroup.adult);
      expect(AgeGroup.fromAge(35), AgeGroup.middleAgedAdult);
      expect(AgeGroup.fromAge(49), AgeGroup.middleAgedAdult);
      expect(AgeGroup.fromAge(50), AgeGroup.olderAdult);
      expect(AgeGroup.fromAge(59), AgeGroup.olderAdult);
      expect(AgeGroup.fromAge(60), AgeGroup.seniorCitizen);
      expect(AgeGroup.fromAge(121), AgeGroup.seniorCitizen);
      expect(AgeGroup.fromAge(12), isNull);
      expect(AgeGroup.fromAge(null), isNull);
    });

    test('calculates age from birth date using the current birthday', () {
      final today = DateTime(2026, 11, 12);

      expect(calculateAge('2008-11-12', today: today), 18);
      expect(calculateAge('2008-11-13', today: today), 17);
      expect(calculateAge('2008-11-12T00:00:00.000000Z', today: today), 18);
    });

    test('missing, future, or invalid birth dates have no age group', () {
      final today = DateTime(2026, 11, 12);

      expect(calculateAge(null, today: today), isNull);
      expect(calculateAge('', today: today), isNull);
      expect(calculateAge('2027-01-01', today: today), isNull);
      expect(calculateAge('2000-02-31', today: today), isNull);
      expect(
        AppUser.fromJson({
          'id': 1,
          'username': 'resident',
          'first_name': 'Test',
          'last_name': 'Resident',
          'email': 'resident@example.test',
        }).age,
        isNull,
      );
    });

    test('loads persisted profile and ID image paths from the API profile', () {
      final user = AppUser.fromJson({
        'id': 1,
        'username': 'resident',
        'first_name': 'Test',
        'last_name': 'Resident',
        'email': 'resident@example.test',
        'street_name': 'Oak Avenue',
        'barangay_name': 'Barangay Aurora',
        'municipality': 'Quezon City',
        'province': 'Metro Manila',
        'postal_code': '1100',
        'profile_picture_url': 'https://api.example.test/profile-picture',
        'valid_id_front_url': 'https://api.example.test/id-front',
        'valid_id_back_url': 'https://api.example.test/id-back',
        'valid_id_type': 'Philippine National ID (PhilID)',
      });

      expect(user.profilePicture, 'https://api.example.test/profile-picture');
      expect(user.validIdFront, 'https://api.example.test/id-front');
      expect(user.validIdBack, 'https://api.example.test/id-back');
      expect(user.validIdType, 'Philippine National ID (PhilID)');
      expect(user.streetName, 'Oak Avenue');
      expect(user.barangayName, 'Barangay Aurora');
      expect(user.municipality, 'Quezon City');
      expect(user.province, 'Metro Manila');
      expect(user.postalCode, '1100');
      expect(user.toJson()['postal_code'], '1100');
    });
  });
}
