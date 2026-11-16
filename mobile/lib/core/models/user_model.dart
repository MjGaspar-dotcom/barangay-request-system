import 'age_group.dart';
import 'recommendation.dart';

class AppUser {
  final int id;
  final String username;
  final String firstName;
  final String? middleName;
  final String lastName;
  final String email;
  final String? contactNumber;
  final String? address;
  final String? streetName;
  final String? barangayName;
  final String? municipality;
  final String? province;
  final String? postalCode;
  final String? birthDate;
  final String? gender;
  final String? civilStatus;
  final String? employmentStatus;
  final bool? hasBusiness;
  final double? yearsOfResidency;
  final List<ResidentRequest>? pastRequests;
  final String verificationStatus;
  final String? profilePicture;
  final String? validIdFront;
  final String? validIdBack;
  final String? validIdType;
  final String role;

  AppUser({
    required this.id,
    required this.username,
    required this.firstName,
    this.middleName,
    required this.lastName,
    required this.email,
    this.contactNumber,
    this.address,
    this.streetName,
    this.barangayName,
    this.municipality,
    this.province,
    this.postalCode,
    this.birthDate,
    this.gender,
    this.civilStatus,
    this.employmentStatus,
    this.hasBusiness,
    this.yearsOfResidency,
    this.pastRequests,
    this.verificationStatus = 'pending',
    this.profilePicture,
    this.validIdFront,
    this.validIdBack,
    this.validIdType,
    this.role = 'resident',
  });

  String get fullName => [
        firstName,
        if (middleName != null && middleName!.trim().isNotEmpty) middleName!,
        lastName,
      ].join(' ');

  bool get isVerified => verificationStatus == 'verified';
  int? get age => calculateAge(birthDate);
  AgeGroup? get ageGroup => AgeGroup.fromAge(age);

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] ?? json['user_id'] ?? 0,
      username: json['username'] ?? '',
      firstName: json['first_name'] ?? '',
      middleName: json['middle_name'],
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      contactNumber: json['contact_number'],
      address: json['address'],
      streetName: json['street_name'],
      barangayName: json['barangay_name'],
      municipality: json['municipality'],
      province: json['province'],
      postalCode: json['postal_code'],
      birthDate: json['birth_date']?.toString(),
      gender: json['gender'],
      civilStatus: json['civil_status'],
      employmentStatus: json['employment_status'],
      hasBusiness: _parseNullableBool(json['has_business']),
      yearsOfResidency:
          double.tryParse(json['years_of_residency']?.toString() ?? ''),
      pastRequests: json['past_requests'] is List
          ? (json['past_requests'] as List)
              .whereType<Map>()
              .map((item) =>
                  ResidentRequest.fromJson(Map<String, dynamic>.from(item)))
              .toList()
          : null,
      verificationStatus: json['verification_status'] ?? 'pending',
      profilePicture: json['profile_picture_url'] ?? json['profile_picture'],
      validIdFront: json['valid_id_front_url'] ?? json['valid_id_front'],
      validIdBack: json['valid_id_back_url'] ?? json['valid_id_back'],
      validIdType: json['valid_id_type']?.toString(),
      role: json['role'] ?? 'resident',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'first_name': firstName,
        'middle_name': middleName,
        'last_name': lastName,
        'email': email,
        'contact_number': contactNumber,
        'address': address,
        'street_name': streetName,
        'barangay_name': barangayName,
        'municipality': municipality,
        'province': province,
        'postal_code': postalCode,
        'birth_date': birthDate,
        'gender': gender,
        'civil_status': civilStatus,
        'employment_status': employmentStatus,
        'has_business': hasBusiness,
        'years_of_residency': yearsOfResidency,
        'past_requests':
            pastRequests?.map((request) => request.toJson()).toList(),
        'verification_status': verificationStatus,
        'profile_picture': profilePicture,
        'valid_id_front': validIdFront,
        'valid_id_back': validIdBack,
        'valid_id_type': validIdType,
        'role': role,
      };

  // Preserve unknown boolean profile values instead of treating them as false.
  static bool? _parseNullableBool(dynamic value) {
    if (value is bool) return value;
    if (value is String) {
      if (value.toLowerCase() == 'true' || value == '1') return true;
      if (value.toLowerCase() == 'false' || value == '0') return false;
    }
    return null;
  }
}
