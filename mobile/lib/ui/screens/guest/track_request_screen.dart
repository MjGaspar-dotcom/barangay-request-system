import 'dart:async';

import 'package:flutter/foundation.dart' show compute;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/request_provider.dart';
import '../../../core/models/request_model.dart';
import '../../../core/utils/qr_image_decoder.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/status_chip.dart';

class TrackRequestScreen extends StatefulWidget {
  final String? initialTracking;
  const TrackRequestScreen({super.key, this.initialTracking});

  @override
  State<TrackRequestScreen> createState() => _TrackRequestScreenState();
}

class _TrackRequestScreenState extends State<TrackRequestScreen>
    with WidgetsBindingObserver {
  final _trackingCtrl = TextEditingController();
  final _imagePicker = ImagePicker();
  Timer? _trackingRefreshTimer;
  String? _trackingNumberToRefresh;
  bool _isAppResumed = true;
  bool _isReadingQr = false;
  String? _qrProgressMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (widget.initialTracking != null) {
      _trackingCtrl.text = widget.initialTracking!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _track();
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final wasResumed = _isAppResumed;
    _isAppResumed = state == AppLifecycleState.resumed;
    final trackingNumber = _trackingNumberToRefresh;
    if (_isAppResumed && !wasResumed && trackingNumber != null) {
      unawaited(
        context.read<RequestProvider>().trackRequest(
              trackingNumber,
              silent: true,
            ),
      );
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _trackingRefreshTimer?.cancel();
    _trackingCtrl.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    final tracking = _trackingCtrl.text.trim();
    if (tracking.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a tracking number.')),
      );
      return;
    }
    _trackingNumberToRefresh = tracking;
    _trackingRefreshTimer?.cancel();
    _trackingRefreshTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) {
        if (!_isAppResumed || !mounted) return;
        unawaited(
          context.read<RequestProvider>().trackRequest(
                tracking,
                silent: true,
              ),
        );
      },
    );
    await context.read<RequestProvider>().trackRequest(tracking);
  }

  Future<void> _uploadQrCode() async {
    final imageFile = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
      maxWidth: 2000,
      maxHeight: 2000,
    );
    if (imageFile == null || !mounted) return;

    setState(() {
      _isReadingQr = true;
      _qrProgressMessage = 'Preparing image...';
    });
    String trackingNumber;
    try {
      await Future<void>.delayed(Duration.zero);
      final imageBytes = await imageFile.readAsBytes();
      if (!mounted) return;

      setState(() => _qrProgressMessage = 'Reading QR code...');
      await Future<void>.delayed(Duration.zero);
      final payload = await compute(
        decodeQrPayloadFromImageBytes,
        imageBytes,
        debugLabel: 'decode-request-qr',
      );
      final decodedTrackingNumber = _trackingNumberFromQr(payload);
      if (decodedTrackingNumber.isEmpty) {
        throw const FormatException(
            'The QR code does not contain a tracking number.');
      }
      trackingNumber = decodedTrackingNumber;
    } catch (error, stackTrace) {
      debugPrint('Uploaded QR code could not be read: $error\n$stackTrace');
      if (!mounted) return;
      setState(() {
        _isReadingQr = false;
        _qrProgressMessage = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not read a tracking number from that QR image.'),
        ),
      );
      return;
    }

    if (!mounted) return;
    _trackingCtrl.text = trackingNumber;
    setState(() {
      _isReadingQr = false;
      _qrProgressMessage = null;
    });
    await _track();
  }

  String _trackingNumberFromQr(String payload) {
    final value = payload.trim();
    if (value.isEmpty) return '';

    final uri = Uri.tryParse(value);
    if (uri != null) {
      for (final key in ['tracking_number', 'tracking', 'code']) {
        final trackingNumber = uri.queryParameters[key]?.trim();
        if (trackingNumber != null && trackingNumber.isNotEmpty) {
          return trackingNumber;
        }
      }

      if (uri.hasScheme) {
        final segments = uri.pathSegments.where((part) => part.isNotEmpty);
        final pathSegments = segments.toList();
        if (pathSegments.length >= 2 &&
            ['track', 'tracking'].contains(
              pathSegments[pathSegments.length - 2].toLowerCase(),
            )) {
          return pathSegments.last.trim();
        }
      }
    }

    return value;
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RequestProvider>();
    final isLoading = provider.status == RequestStatus.loading;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F6),
      appBar: AppBar(title: const Text('Track Request')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFEDF0EC)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Enter Tracking Number',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: Color(0xFF1A2E1F),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      key: const Key('track_input'),
                      controller: _trackingCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        hintText: 'e.g. BRG-20241001-XXXX',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12)),
                        filled: true,
                        fillColor: const Color(0xFFF8FAF9),
                      ),
                      onSubmitted: (_) => _track(),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      key: const Key('btn_upload_tracking_qr'),
                      onPressed:
                          isLoading || _isReadingQr ? null : _uploadQrCode,
                      icon: _isReadingQr
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.qr_code_2),
                      label: Text(
                        _isReadingQr ? 'Reading QR code...' : 'Upload QR Code',
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        foregroundColor: const Color(0xFF1A6B4A),
                        side: const BorderSide(color: Color(0xFF1A6B4A)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    if (_isReadingQr) ...[
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: const LinearProgressIndicator(
                          minHeight: 4,
                          semanticsLabel: 'Reading uploaded QR code',
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _qrProgressMessage ?? 'Reading QR code...',
                        key: const Key('track_qr_progress_message'),
                        style: const TextStyle(
                          color: Color(0xFF52645A),
                          fontSize: 12,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    LoadingButton(
                      id: 'btn_track_submit',
                      label: 'Track Request',
                      isLoading: isLoading || _isReadingQr,
                      onPressed: _track,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Result
              if (provider.errorMessage != null)
                _ErrorCard(message: provider.errorMessage!),
              if (provider.trackResult != null)
                _TrackResultCard(result: provider.trackResult!),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrackResultCard extends StatelessWidget {
  final TrackResult result;
  const _TrackResultCard({required this.result});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEDF0EC)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Request Status',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  color: Color(0xFF1A2E1F),
                ),
              ),
              StatusChip(status: result.status),
            ],
          ),
          const Divider(height: 24),
          if (result.trackingNumber != null)
            _InfoRow(label: 'Tracking #', value: result.trackingNumber!),
          if (result.documentTypeName != null)
            _InfoRow(label: 'Document', value: result.documentTypeName!),
          if (result.createdAt != null)
            _InfoRow(
                label: 'Date Filed', value: _formatDate(result.createdAt!)),
          if (result.remarks != null && result.remarks!.isNotEmpty)
            _InfoRow(label: 'Remarks', value: result.remarks!),
          if (result.rejectionReason != null &&
              result.rejectionReason!.isNotEmpty)
            _InfoRow(
              label: 'Rejection reason',
              value: result.rejectionReason!,
            ),
          if (result.rejectionOther != null &&
              result.rejectionOther!.isNotEmpty)
            _InfoRow(
              label: 'Additional details',
              value: result.rejectionOther!,
            ),
          const SizedBox(height: 8),
          RequestStatusTimeline(result: result),
        ],
      ),
    );
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

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: Color(0xFF1A2E1F),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RequestStatusTimeline extends StatelessWidget {
  final TrackResult result;

  const RequestStatusTimeline({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final status = result.status.trim().toLowerCase().replaceAll('_', ' ');
    final isRejected = status == 'rejected';
    const requestStatuses = {
      'request submitted',
      'pending',
      'approved',
      'processing',
      'ready for pickup',
      'completed',
      'rejected',
    };
    final steps = isRejected
        ? const ['Request Submitted', 'Rejected']
        : requestStatuses.contains(status)
            ? const [
                'Request Submitted',
                'Processing & Approval',
                'Ready for Pickup',
                'Completed',
              ]
            : const [
                'Request Submitted',
                'Status unavailable',
              ];
    final currentIdx = switch (status) {
      'request submitted' || 'pending' => 0,
      'approved' || 'processing' => 1,
      'ready for pickup' => 2,
      'completed' => 3,
      'rejected' => 1,
      _ => 1,
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 24),
        const Text(
          'Status timeline',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        const SizedBox(height: 12),
        for (final entry in steps.asMap().entries)
          _TimelineRow(
            label: entry.value,
            isComplete:
                entry.key < currentIdx || (isRejected && entry.key == 0),
            isCurrent: entry.key == currentIdx,
            isRejected: isRejected && entry.key == currentIdx,
            isLast: entry.key == steps.length - 1,
            timestamp: _timestampFor(entry.key),
          ),
        if (status != 'request submitted' &&
            status != 'pending' &&
            result.decisionAt != null)
          Padding(
            padding: const EdgeInsets.only(left: 30, top: 4),
            child: Text(
              'Decision recorded ${_formatDate(result.decisionAt!)}',
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ),
      ],
    );
  }

  String? _timestampFor(int index) {
    if (index == 0) return result.createdAt;
    return null;
  }

  String _formatDate(String raw) {
    final date = DateTime.tryParse(raw)?.toLocal();
    if (date == null) return raw;
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _TimelineRow extends StatelessWidget {
  final String label;
  final bool isComplete;
  final bool isCurrent;
  final bool isRejected;
  final bool isLast;
  final String? timestamp;

  const _TimelineRow({
    required this.label,
    required this.isComplete,
    required this.isCurrent,
    required this.isRejected,
    required this.isLast,
    required this.timestamp,
  });

  @override
  Widget build(BuildContext context) {
    final color = isRejected
        ? Colors.red.shade700
        : isComplete || isCurrent
            ? const Color(0xFF1A6B4A)
            : const Color(0xFFB0B8B3);

    return SizedBox(
      height: isLast ? 36 : 52,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 22,
            child: Column(
              children: [
                Icon(
                  isRejected
                      ? Icons.cancel
                      : isComplete
                          ? Icons.check_circle
                          : isCurrent
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                  size: 18,
                  color: color,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isComplete
                          ? const Color(0xFF1A6B4A)
                          : const Color(0xFFE0E0E0),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isCurrent || isComplete
                          ? const Color(0xFF1A2E1F)
                          : Colors.black54,
                      fontSize: 12,
                      fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                  if (timestamp != null && timestamp!.isNotEmpty)
                    Text(
                      _formatDate(timestamp!),
                      style:
                          const TextStyle(fontSize: 10, color: Colors.black54),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    final date = DateTime.tryParse(raw)?.toLocal();
    if (date == null) return raw;
    return '${date.month}/${date.day}/${date.year}';
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  const _ErrorCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF0F0),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFCDD2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.red),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
