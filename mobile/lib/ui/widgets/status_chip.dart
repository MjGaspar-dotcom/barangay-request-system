import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final normalizedStatus = status.trim().toLowerCase().replaceAll('_', ' ');
    final config = _getConfig(normalizedStatus);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        config.label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: config.foreground,
        ),
      ),
    );
  }

  _StatusConfig _getConfig(String s) {
    switch (s) {
      case 'submitted':
      case 'request submitted':
        return const _StatusConfig(
          label: 'Request Submitted',
          background: AppColors.warningContainer,
          foreground: AppColors.warningDark,
        );
      case 'pending':
        return const _StatusConfig(
          label: 'Pending',
          background: AppColors.warningContainer,
          foreground: AppColors.warningDark,
        );
      case 'approved':
        return const _StatusConfig(
          label: 'Processing & Approval',
          background: AppColors.informationContainer,
          foreground: AppColors.information,
        );
      case 'processing':
        return const _StatusConfig(
          label: 'Processing',
          background: AppColors.informationContainer,
          foreground: AppColors.information,
        );
      case 'completed':
      case 'ready for pickup':
        return _StatusConfig(
          label: s == 'completed' ? 'Completed' : 'Ready for Pickup',
          background: AppColors.successContainer,
          foreground: AppColors.successDark,
        );
      case 'rejected':
      case 'cancelled':
        return _StatusConfig(
          label: s == 'rejected' ? 'Rejected' : 'Cancelled',
          background: AppColors.errorContainer,
          foreground: AppColors.errorDark,
        );
      default:
        return _StatusConfig(
          label: s.isEmpty ? 'Unknown' : s[0].toUpperCase() + s.substring(1),
          background: AppColors.surfaceMuted,
          foreground: AppColors.textSecondary,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final Color background;
  final Color foreground;
  const _StatusConfig({
    required this.label,
    required this.background,
    required this.foreground,
  });
}
