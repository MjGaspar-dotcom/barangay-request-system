class CommunityRecommendation {
  final int id;
  final String title;
  final String description;
  final String category;
  final String? eligibility;
  final int? minAge;
  final int? maxAge;

  const CommunityRecommendation({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    this.eligibility,
    this.minAge,
    this.maxAge,
  });

  String get categoryLabel => switch (category) {
        'government_assistance' => 'Government assistance',
        'program' => 'Program',
        'service' => 'Service',
        'announcement' => 'Announcement',
        'activity' => 'Activity',
        _ => 'Community update',
      };

  String? get ageRange {
    if (minAge == null && maxAge == null) return null;
    if (minAge == null) return 'Up to $maxAge years';
    if (maxAge == null) return '$minAge+ years';
    return '$minAge-$maxAge years';
  }

  factory CommunityRecommendation.fromJson(Map<String, dynamic> json) {
    final id = int.tryParse(json['id']?.toString() ?? '');
    final title = json['title'];
    final description = json['description'];
    final category = json['category'];

    if (id == null ||
        title is! String ||
        description is! String ||
        category is! String) {
      throw const FormatException('Invalid community recommendation.');
    }

    return CommunityRecommendation(
      id: id,
      title: title,
      description: description,
      category: category,
      eligibility: json['eligibility']?.toString(),
      minAge: int.tryParse(json['min_age']?.toString() ?? ''),
      maxAge: int.tryParse(json['max_age']?.toString() ?? ''),
    );
  }
}
