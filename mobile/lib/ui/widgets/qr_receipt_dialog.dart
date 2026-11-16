import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:share_plus/share_plus.dart';

class QrReceiptDialog extends StatelessWidget {
  final String trackingNumber;
  final String? qrCodeSvg;
  final String? documentName;

  const QrReceiptDialog({
    super.key,
    required this.trackingNumber,
    this.qrCodeSvg,
    this.documentName,
  });

  static Future<void> show(
    BuildContext context, {
    required String trackingNumber,
    String? qrCodeSvg,
    String? documentName,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => QrReceiptDialog(
        trackingNumber: trackingNumber,
        qrCodeSvg: qrCodeSvg,
        documentName: documentName,
      ),
    );
  }

  Future<void> _downloadQr(BuildContext context) async {
    final svg = qrCodeSvg?.trim();
    if (svg == null || svg.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A QR image is not available to download yet.'),
        ),
      );
      return;
    }

    final fileName =
        'barangay-request-${trackingNumber.replaceAll(RegExp(r'[^A-Za-z0-9]'), '_')}.svg';

    try {
      if (kIsWeb) Share.downloadFallbackEnabled = true;
      await Share.shareXFiles(
        [
          XFile.fromData(
            utf8.encode(svg),
            mimeType: 'image/svg+xml',
            name: fileName,
          ),
        ],
        subject: 'Barangay request receipt',
      );
    } on PlatformException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              error.message ??
                  'The QR receipt could not be downloaded from this device.',
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final svg = qrCodeSvg?.trim();

    return AlertDialog(
      title: const Text('Request Receipt'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (svg != null && svg.isNotEmpty)
                SvgPicture.string(
                  svg,
                  width: 220,
                  height: 220,
                  semanticsLabel: 'QR code for request tracking',
                )
              else
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Icon(Icons.qr_code_2, size: 48, color: Colors.grey),
                      SizedBox(height: 8),
                      Text(
                        'The server did not provide a QR image. '
                        'Use the tracking number below.',
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              if (documentName != null && documentName!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  documentName!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
              const SizedBox(height: 12),
              const Text('Tracking number'),
              const SizedBox(height: 4),
              SelectableText(
                trackingNumber,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                  letterSpacing: 0.4,
                ),
              ),
              if (svg != null && svg.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Scan this QR code to open the public request tracker.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    key: const Key('download_qr_button'),
                    onPressed: () => _downloadQr(context),
                    icon: const Icon(Icons.download_rounded),
                    label: const Text('Download QR image'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Done'),
        ),
      ],
    );
  }
}
