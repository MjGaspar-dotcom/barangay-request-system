import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/request_provider.dart';
import '../../../core/models/request_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/qr_receipt_dialog.dart';
import '../../widgets/status_chip.dart';
import 'create_request_screen.dart';
import 'generated_document_screen.dart';
import '../guest/track_request_screen.dart';

class MyRequestsScreen extends StatefulWidget {
  const MyRequestsScreen({super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RequestProvider>().fetchMyRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RequestProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<RequestProvider>().fetchMyRequests(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('fab_new_request'),
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CreateRequestScreen()),
        ),
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
      ),
      body: Builder(
        builder: (_) {
          if (provider.status == RequestStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (provider.requests.isEmpty && provider.errorMessage != null) {
            return _buildError(context, provider.errorMessage!);
          }
          if (provider.requests.isEmpty) {
            return _buildEmpty(context);
          }
          return RefreshIndicator(
            onRefresh: () => context.read<RequestProvider>().fetchMyRequests(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.requests.length +
                  (provider.errorMessage == null ? 0 : 1),
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                if (provider.errorMessage != null && i == 0) {
                  return _InlineRequestError(
                    message: provider.errorMessage!,
                    onRetry: () =>
                        context.read<RequestProvider>().fetchMyRequests(),
                  );
                }
                final requestIndex =
                    i - (provider.errorMessage == null ? 0 : 1);
                return _RequestListItem(
                  request: provider.requests[requestIndex],
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildError(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () =>
                  context.read<RequestProvider>().fetchMyRequests(),
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.folder_open,
            size: 72,
            color: AppColors.borderEmphasis,
          ),
          const SizedBox(height: 16),
          const Text(
            'No requests found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tap the button below to make your first request.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSubtle),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CreateRequestScreen()),
            ),
            icon: const Icon(Icons.add),
            label: const Text('Make a Request'),
          ),
        ],
      ),
    );
  }
}

class _RequestListItem extends StatelessWidget {
  final BarangayRequest request;
  const _RequestListItem({required this.request});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request.documentType?.name ?? 'Document Request',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              StatusChip(status: request.status),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Purpose: ${request.purpose}',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          if (request.remarks != null && request.remarks!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      request.remarks!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            _formatDate(request.createdAt),
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSubtle,
            ),
          ),
          if (request.trackingNumber?.isNotEmpty == true) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                TextButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => TrackRequestScreen(
                        initialTracking: request.trackingNumber,
                      ),
                    ),
                  ),
                  icon: const Icon(Icons.timeline, size: 18),
                  label: const Text('Track'),
                ),
                if (request.qrCodeSvg?.isNotEmpty == true)
                  TextButton.icon(
                    onPressed: () => QrReceiptDialog.show(
                      context,
                      trackingNumber: request.trackingNumber!,
                      qrCodeSvg: request.qrCodeSvg,
                      documentName: request.documentType?.name,
                    ),
                    icon: const Icon(Icons.qr_code_2, size: 18),
                    label: const Text('QR receipt'),
                  ),
                if (_hasGeneratedDocument)
                  TextButton.icon(
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => GeneratedDocumentScreen(
                          request: request,
                        ),
                      ),
                    ),
                    icon: const Icon(Icons.description_outlined, size: 18),
                    label: const Text('Generated document'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  bool get _hasGeneratedDocument {
    final status = request.status.toLowerCase().replaceAll('_', ' ');
    return status == 'ready for pickup' || status == 'completed';
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      return '${dt.month}/${dt.day}/${dt.year}';
    } catch (_) {
      return raw;
    }
  }
}

class _InlineRequestError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _InlineRequestError({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.warningContainer,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.warningDark),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
