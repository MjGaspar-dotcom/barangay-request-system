import 'package:flutter/material.dart';

import 'auth/login_screen.dart';
import 'guest/guest_access_screen.dart';
import 'guest/track_request_screen.dart';
import '../../core/theme/app_theme.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primary,
                  AppColors.primaryDark,
                  AppColors.darkSurface,
                ],
              ),
            ),
          ),
          // Decorative circles
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            top: 80,
            right: 30,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.07),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 48),
                  // Logo
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.surface.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        'assets/images/logo.webp',
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'Barangay\nDocument\nRequest',
                    style: TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.w800,
                      color: AppColors.surface,
                      height: 1.1,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Request barangay documents quickly\nand track them from your phone.',
                    style: TextStyle(
                      fontSize: 15,
                      color: AppColors.surface.withValues(alpha: 0.7),
                      height: 1.5,
                    ),
                  ),
                  const Spacer(),
                  // Action Buttons
                  _LandingButton(
                    id: 'btn_resident_login',
                    label: 'Resident Login',
                    icon: Icons.person_outline,
                    isPrimary: true,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _LandingButton(
                    id: 'btn_continue_as_guest',
                    label: 'Continue as Guest',
                    icon: Icons.person_outline,
                    isPrimary: false,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const GuestAccessScreen(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _LandingButton(
                    id: 'btn_track_request',
                    label: 'Track an Existing Request',
                    icon: Icons.search,
                    isPrimary: false,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const TrackRequestScreen()),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LandingButton extends StatelessWidget {
  final String id;
  final String label;
  final IconData icon;
  final bool isPrimary;
  final VoidCallback onTap;

  const _LandingButton({
    required this.id,
    required this.label,
    required this.icon,
    required this.isPrimary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (isPrimary) {
      return SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton.icon(
          key: Key(id),
          onPressed: onTap,
          icon: Icon(icon),
          label: Text(label),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.surface,
            foregroundColor: AppColors.primary,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      );
    }
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        key: Key(id),
        onPressed: onTap,
        icon: Icon(icon, color: AppColors.surface),
        label: Text(
          label,
          style: const TextStyle(color: AppColors.surface),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: AppColors.surface.withValues(alpha: 0.4),
          ),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}
