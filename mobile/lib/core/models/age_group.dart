enum AgeGroup {
  teenager('Teenagers', 13, 17),
  youngAdult('Young Adults', 18, 24),
  adult('Adults', 25, 34),
  middleAgedAdult('Middle-aged Adults', 35, 49),
  olderAdult('Older Adults', 50, 59),
  seniorCitizen('Senior Citizens', 60, null);

  const AgeGroup(this.label, this.minAge, this.maxAge);

  final String label;
  final int minAge;
  final int? maxAge;

  static AgeGroup? fromAge(int? age) {
    if (age == null) return null;
    for (final group in values) {
      if (age >= group.minAge &&
          (group.maxAge == null || age <= group.maxAge!)) {
        return group;
      }
    }
    return null;
  }
}

int? calculateAge(String? birthDate, {DateTime? today}) {
  if (birthDate == null || birthDate.trim().isEmpty) return null;

  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(birthDate.trim());
  if (match == null) return null;

  final year = int.parse(match.group(1)!);
  final month = int.parse(match.group(2)!);
  final day = int.parse(match.group(3)!);
  final birth = DateTime.utc(year, month, day);
  if (birth.year != year || birth.month != month || birth.day != day) {
    return null;
  }

  final currentDate = today ?? DateTime.now();
  var age = currentDate.year - year;
  if (currentDate.month < month ||
      (currentDate.month == month && currentDate.day < day)) {
    age--;
  }
  return age < 0 ? null : age;
}
