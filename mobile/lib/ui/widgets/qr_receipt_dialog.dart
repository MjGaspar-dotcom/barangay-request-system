import 'package:file_saver/file_saver.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:image/image.dart' as img;
import 'package:zxing2/qrcode.dart';

class QrReceiptDialog extends StatelessWidget {
  final String trackingNumber;
  final String? documentName;

  const QrReceiptDialog({
    super.key,
    required this.trackingNumber,
    this.documentName,
  });

  static Future<void> show(
    BuildContext context, {
    required String trackingNumber,
    String? documentName,
  }) {
    return showDialog<void>(
      context: context,
      builder: (_) => QrReceiptDialog(
        trackingNumber: trackingNumber,
        documentName: documentName,
      ),
    );
  }

  Future<void> _downloadQr(BuildContext context) async {
    try {
      final pngBytes = trackingQrPng(trackingNumber);
      final savedPath = await FileSaver.instance.saveFile(
        name:
            'barangay-request-${trackingNumber.replaceAll(RegExp(r'[^A-Za-z0-9]'), '_')}',
        bytes: pngBytes,
        fileExtension: 'png',
        mimeType: MimeType.png,
      );
      if (!context.mounted) return;
      if (savedPath.startsWith('Something went wrong')) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('The QR image could not be saved.')),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('QR image downloaded.')),
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
    } on Exception catch (error) {
      debugPrint('QR image download failed: $error');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('The QR image could not be saved. Please try again.'),
          ),
        );
      }
    }
  }

  static String trackingQrSvg(String trackingNumber) {
    final matrix = Encoder.encode(
      trackingNumber,
      ErrorCorrectionLevel.l,
    ).matrix!;
    const quietZone = 4;
    final viewSize = matrix.width + quietZone * 2;
    final path = StringBuffer();

    for (var y = 0; y < matrix.height; y++) {
      for (var x = 0; x < matrix.width; x++) {
        if (matrix.get(x, y) == 1) {
          path.write('M${x + quietZone} ${y + quietZone}h1v1h-1z');
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" '
        'viewBox="0 0 $viewSize $viewSize">'
        '<rect width="100%" height="100%" fill="#ffffff"/>'
        '<path fill="#000000" d="$path"/>'
        '</svg>';
  }

  static Uint8List trackingQrPng(String trackingNumber) {
    final matrix = Encoder.encode(
      trackingNumber,
      ErrorCorrectionLevel.l,
    ).matrix!;
    const imageSize = 1024;
    const quietZone = 4;
    final moduleCount = matrix.width + quietZone * 2;
    final moduleSize = imageSize ~/ moduleCount;
    final drawnSize = moduleCount * moduleSize;
    final origin = (imageSize - drawnSize) ~/ 2;
    final image =
        img.Image(width: imageSize, height: imageSize, numChannels: 3);
    img.fill(image, color: img.ColorRgb8(255, 255, 255));

    for (var y = 0; y < matrix.height; y++) {
      for (var x = 0; x < matrix.width; x++) {
        if (matrix.get(x, y) != 1) continue;

        final left = origin + (x + quietZone) * moduleSize;
        final top = origin + (y + quietZone) * moduleSize;
        for (var dy = 0; dy < moduleSize; dy++) {
          for (var dx = 0; dx < moduleSize; dx++) {
            image.setPixelRgb(left + dx, top + dy, 0, 0, 0);
          }
        }
      }
    }

    return Uint8List.fromList(img.encodePng(image));
  }

  @override
  Widget build(BuildContext context) {
    final svg = trackingQrSvg(trackingNumber);

    return AlertDialog(
      title: const Text('Request Receipt'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SvgPicture.string(
                svg,
                width: 220,
                height: 220,
                semanticsLabel: 'QR code for request tracking',
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
              const SizedBox(height: 8),
              Text(
                'Upload this QR code in the app to track your request.',
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
