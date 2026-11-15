import 'package:flutter/material.dart';

class GoogleSignInButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Key? buttonKey;

  const GoogleSignInButton({
    super.key,
    required this.onPressed,
    this.buttonKey,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        key: buttonKey,
        onPressed: onPressed,
        icon: const Text(
          'G',
          style: TextStyle(
            color: Color(0xFF4285F4),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        label: const Text('Continue with Google'),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF1A2E1F),
          side: const BorderSide(color: Color(0xFFDDE1E7)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
