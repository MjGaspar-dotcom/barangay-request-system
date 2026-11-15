import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:zxing2/qrcode.dart';

import '../../../core/providers/request_provider.dart';
import '../../../core/models/request_model.dart';
import '../../widgets/loading_button.dart';
import '../../widgets/status_chip.dart';

class TrackRequestScreen extends StatefulWidget {
  final String? initialTracking;
  const TrackRequestScreen({super.key, this.initialTracking});

  @override
  State<TrackRequestScreen> createState() => _TrackRequestScreenState();
}

class _TrackRequestScreenState extends State<TrackRequestScreen> {
  final _trackingCtrl = TextEditingController();
  final _imagePicker = ImagePicker();
  bool _isReadingQr = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialTracking != null) {
      _trackingCtrl.text = widget.initialTracking!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _track());
    }
  }

  @override
  void dispose() {
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

    setState(() => _isReadingQr = true);
    try {
      final imageBytes = await imageFile.readAsBytes();
      if (!mounted) return;
      final image = img.decodeImage(imageBytes);
      if (image == null) {
        throw const FormatException('The selected file is not a valid image.');
      }

      final pixels = image
          .convert(numChannels: 4)
          .getBytes(order: img.ChannelOrder.abgr)
          .buffer
          .asInt32List();
      final source = RGBLuminanceSource(image.width, image.height, pixels);
      final bitmap = BinaryBitmap(GlobalHistogramBinarizer(source));
      final payload = QRCodeReader().decode(bitmap).text;
      final trackingNumber = _trackingNumberFromQr(payload);
      if (trackingNumber.isEmpty) {
        throw const FormatException(
            'The QR code does not contain a tracking number.');
      }

      _trackingCtrl.text = trackingNumber;
      setState(() => _isReadingQr = false);
      await _track();
    } catch (_) {
      if (!mounted) return;
      setState(() => _isReadingQr = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not read a tracking number from that QR image.'),
        ),
      );
    }
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
              if (provider.status == RequestStatus.error &&
                  provider.errorMessage != null)
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
            color: Colors.black.withOpacity(0.04),
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
          const SizedBox(height: 8),
          // Status Progress
          _StatusTimeline(status: result.status, remarks: result.remarks),
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

class _StatusTimeline extends StatelessWidget {
  final String status;
  final String? remarks;
  const _StatusTimeline({required this.status, this.remarks});

  @override
  Widget build(BuildContext context) {
    const steps = [
      'request_submitted',
      'approved',
      'ready_for_pickup',
      'completed',
    ];
    final normalizedStatus = status.toLowerCase();
    final currentIdx = steps.indexOf(normalizedStatus);
    final isRejected = normalizedStatus == 'rejected';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 24),
        Text(
          isRejected ? 'Request Rejected' : 'Progress',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        if (isRejected && remarks != null && remarks!.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            remarks!,
            style: const TextStyle(color: Color(0xFFC62828), fontSize: 12),
          ),
        ],
        const SizedBox(height: 12),
        Row(
          children: steps.asMap().entries.map((entry) {
            final idx = entry.key;
            final isDone = currentIdx >= idx;
            return Expanded(
              child: Row(
                children: [
                  Column(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: isDone
                            ? const Color(0xFF1A6B4A)
                            : const Color(0xFFE0E0E0),
                        child: Icon(
                          isDone ? Icons.check : Icons.circle,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        const [
                          'Submitted',
                          'Approved',
                          'Ready for Pickup',
                          'Completed',
                        ][idx],
                        style: TextStyle(
                          fontSize: 10,
                          color: isDone ? const Color(0xFF1A6B4A) : Colors.grey,
                          fontWeight:
                              isDone ? FontWeight.w700 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                  if (idx < steps.length - 1)
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: Divider(
                          color: currentIdx > idx
                              ? const Color(0xFF1A6B4A)
                              : const Color(0xFFE0E0E0),
                          thickness: 2,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
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
