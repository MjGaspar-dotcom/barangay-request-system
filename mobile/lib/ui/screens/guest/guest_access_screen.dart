import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../requests/create_request_screen.dart';
import 'track_request_screen.dart';

class GuestAccessScreen extends StatelessWidget {
  const GuestAccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Continue as Guest')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              'No account needed',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Submit a document request with your contact details and a valid ID, '
              'or track a request using its tracking code or QR code.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            _GuestActionCard(
              icon: Icons.description_outlined,
              title: 'Request a Document',
              description: 'A valid government ID is required.',
              key: const Key('btn_guest_request'),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const CreateRequestScreen(guestMode: true),
                ),
              ),
            ),
            const SizedBox(height: 12),
            _GuestActionCard(
              icon: Icons.qr_code_scanner,
              title: 'Track a Request',
              description: 'Enter your tracking code or upload its QR code.',
              key: const Key('btn_guest_track_request'),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const TrackRequestScreen(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestActionCard extends StatelessWidget {
  const _GuestActionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.large),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Icon(icon, size: 28, color: AppColors.primary),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}
