abstract final class InputValidators {
  static final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
  static final _usernamePattern = RegExp(r'^[A-Za-z0-9_-]+$');

  static String? username(
    String? value, {
    String requiredMessage = 'Required',
  }) {
    final username = value?.trim() ?? '';
    if (username.isEmpty) return requiredMessage;
    if (username.length > 255) return 'Must be 255 characters or fewer.';
    if (!_usernamePattern.hasMatch(username)) {
      return 'Use letters, numbers, dashes, and underscores only.';
    }
    return null;
  }

  static String? email(
    String? value, {
    bool optional = false,
    String requiredMessage = 'Required',
  }) {
    final email = value?.trim() ?? '';
    if (email.isEmpty) return optional ? null : requiredMessage;
    if (email.length > 255 || !_emailPattern.hasMatch(email)) {
      return 'Valid email required';
    }
    return null;
  }

  static String? contactNumber(
    String? value, {
    bool optional = false,
    String requiredMessage = 'Required',
  }) {
    final contactNumber = value?.trim() ?? '';
    if (contactNumber.isEmpty) return optional ? null : requiredMessage;
    if (contactNumber.length > 20) {
      return 'Must be 20 characters or fewer.';
    }
    return null;
  }

  static String? requiredText(
    String? value, {
    String requiredMessage = 'Required',
    required int maxLength,
  }) {
    final text = value?.trim() ?? '';
    if (text.isEmpty) return requiredMessage;
    if (text.length > maxLength) {
      return 'Must be $maxLength characters or fewer.';
    }
    return null;
  }
}
