import 'package:flutter/material.dart';

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(status.toLowerCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        config.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: config.foreground,
        ),
      ),
    );
  }

  _StatusConfig _getConfig(String s) {
    switch (s) {
      case 'pending':
        return _StatusConfig(
          label: 'Pending',
          background: const Color(0xFFFFF3CD),
          foreground: const Color(0xFFB8860B),
        );
      case 'processing':
        return _StatusConfig(
          label: 'Processing',
          background: const Color(0xFFE3F2FD),
          foreground: const Color(0xFF1565C0),
        );
      case 'completed':
      case 'approved':
        return _StatusConfig(
          label: s == 'completed' ? 'Completed' : 'Approved',
          background: const Color(0xFFE8F5E9),
          foreground: const Color(0xFF2E7D32),
        );
      case 'rejected':
      case 'cancelled':
        return _StatusConfig(
          label: s == 'rejected' ? 'Rejected' : 'Cancelled',
          background: const Color(0xFFFFEBEE),
          foreground: const Color(0xFFC62828),
        );
      default:
        return _StatusConfig(
          label: s[0].toUpperCase() + s.substring(1),
          background: const Color(0xFFF5F5F5),
          foreground: Colors.grey,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final Color background;
  final Color foreground;
  _StatusConfig({
    required this.label,
    required this.background,
    required this.foreground,
  });
}
