class AppUser {
  final int id;
  final String username;
  final String firstName;
  final String lastName;
  final String email;
  final String? contactNumber;
  final String? address;
  final String? birthDate;
  final String? gender;
  final String? civilStatus;
  final String verificationStatus;
  final String? profilePicture;
  final String? validIdFront;
  final String? validIdBack;
  final String role;

  AppUser({
    required this.id,
    required this.username,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.contactNumber,
    this.address,
    this.birthDate,
    this.gender,
    this.civilStatus,
    this.verificationStatus = 'pending',
    this.profilePicture,
    this.validIdFront,
    this.validIdBack,
    this.role = 'resident',
  });

  String get fullName => '$firstName $lastName';

  bool get isVerified => verificationStatus == 'verified';

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      contactNumber: json['contact_number'],
      address: json['address'],
      birthDate: json['birth_date'],
      gender: json['gender'],
      civilStatus: json['civil_status'],
      verificationStatus: json['verification_status'] ?? 'pending',
      profilePicture: json['profile_picture'],
      validIdFront: json['valid_id_front'],
      validIdBack: json['valid_id_back'],
      role: json['role'] ?? 'resident',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'contact_number': contactNumber,
        'address': address,
        'birth_date': birthDate,
        'gender': gender,
        'civil_status': civilStatus,
        'verification_status': verificationStatus,
        'profile_picture': profilePicture,
        'valid_id_front': validIdFront,
        'valid_id_back': validIdBack,
        'role': role,
      };
}
