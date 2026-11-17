import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/models/request_model.dart';
import '../../../core/providers/notification_provider.dart';
import '../../../core/providers/request_provider.dart';
import '../../../core/models/notification_model.dart';
import '../../../core/theme/app_theme.dart';
import '../requests/generated_document_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<NotificationProvider>().fetch(),
    );
  }

  Future<void> _markAsRead(AppNotification notification) async {
    await context.read<NotificationProvider>().markAsRead(notification);
  }

  Future<void> _handleNotificationTap(AppNotification notification) async {
    unawaited(_markAsRead(notification));
    if (!mounted || !notification.isReadyForPickup) return;

    final requestId = notification.requestId;
    if (requestId == null || requestId <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('This notification is not linked to a request.'),
        ),
      );
      return;
    }

    final requests = context.read<RequestProvider>().requests;
    BarangayRequest? request;
    for (final item in requests) {
      if (item.id == requestId) {
        request = item;
        break;
      }
    }
    final requestToPreview = request ??
        BarangayRequest(
          id: requestId,
          status: 'ready_for_pickup',
          createdAt: notification.createdAt,
          purpose: '',
        );

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GeneratedDocumentScreen(request: requestToPreview),
      ),
    );
  }

  Future<void> _markAllAsRead() async {
    final provider = context.read<NotificationProvider>();
    final success = await provider.markAllAsRead();
    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (provider.unreadCount > 0)
            IconButton(
              tooltip: 'Mark all as read',
              icon: const Icon(Icons.done_all),
              onPressed: _markAllAsRead,
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh notifications',
            onPressed: () => context.read<NotificationProvider>().fetch(),
          ),
        ],
      ),
      body: provider.loading && provider.notifications.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : provider.notifications.isEmpty
              ? provider.errorMessage != null
                  ? _buildError(provider.errorMessage!)
                  : _buildEmpty()
              : RefreshIndicator(
                  onRefresh: () async {
                    await context.read<NotificationProvider>().fetch();
                  },
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.notifications.length +
                        (provider.errorMessage == null ? 0 : 1),
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, index) {
                      if (provider.errorMessage != null && index == 0) {
                        return _InlineError(
                          message: provider.errorMessage!,
                          onRetry: () =>
                              context.read<NotificationProvider>().fetch(),
                        );
                      }

                      final notificationIndex =
                          index - (provider.errorMessage == null ? 0 : 1);
                      final notification =
                          provider.notifications[notificationIndex];
                      return _NotifCard(
                        notif: notification,
                        onTap: () => _handleNotificationTap(notification),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildError(String message) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.notifications_off_outlined,
            size: 48,
            color: AppColors.textSubtle,
          ),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.read<NotificationProvider>().fetch(),
            icon: const Icon(Icons.refresh),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: const BoxDecoration(
              color: AppColors.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 36,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'You’re all caught up',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Updates about your requests will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final AppNotification notif;
  final VoidCallback onTap;

  const _NotifCard({required this.notif, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final accent = Theme.of(context).colorScheme.primary;
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      color: notif.isRead ? AppColors.surface : AppColors.surfaceMuted,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: notif.isRead ? AppColors.border : AppColors.borderEmphasis,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  notif.isRead
                      ? Icons.notifications_none_rounded
                      : Icons.notifications_active_rounded,
                  color: accent,
                  size: 21,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            notif.title.isNotEmpty
                                ? notif.title
                                : 'Barangay update',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: notif.isRead
                                  ? FontWeight.w600
                                  : FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        if (!notif.isRead) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryContainer,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'NEW',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      notif.message,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        fontWeight:
                            notif.isRead ? FontWeight.normal : FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 9),
                    Row(
                      children: [
                        const Icon(
                          Icons.schedule_rounded,
                          size: 13,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatDate(notif.createdAt),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (!notif.isRead) ...[
                          const Spacer(),
                          Text(
                            'Tap to mark as read',
                            style: TextStyle(
                              fontSize: 10,
                              color: accent,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String raw) {
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) return 'Date unavailable';

    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.month}/${dt.day}/${dt.year} $hour:${dt.minute.toString().padLeft(2, '0')} $period';
  }
}

class _InlineError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _InlineError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.warningContainer,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.warningDark),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
