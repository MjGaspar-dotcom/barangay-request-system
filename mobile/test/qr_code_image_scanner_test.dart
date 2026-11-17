import 'dart:typed_data';

import 'package:barangay_mobile/core/services/qr_code_image_scanner.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:zxing2/qrcode.dart';

const _payload =
    'http://127.0.0.1:8000/track-request?tracking_number=BR-20261117-8AZRRL';

void main() {
  test('decodes an undamaged QR image', () {
    expect(
      QrCodeImageScanner.decode(_qrImageBytes(corruptFormatInfo: false)),
      _payload,
    );
  });

  test('repairs damaged QR format information in an uploaded image', () {
    expect(
      QrCodeImageScanner.decode(_qrImageBytes(corruptFormatInfo: true)),
      _payload,
    );
  });
}

Uint8List _qrImageBytes({required bool corruptFormatInfo}) {
  final qrCode = Encoder.encode(_payload, ErrorCorrectionLevel.m);
  final matrix = qrCode.matrix!;
  if (corruptFormatInfo) {
    for (var i = 0; i < 4; i++) {
      matrix.setBool(8, i, matrix.get(8, i) == 0);
      matrix.setBool(
          matrix.width - i - 1, 8, matrix.get(matrix.width - i - 1, 8) == 0);
    }
  }

  const moduleSize = 6;
  const quietZone = 4;
  final imageSize = (matrix.width + quietZone * 2) * moduleSize;
  final image = img.Image(width: imageSize, height: imageSize);
  img.fill(image, color: img.ColorRgb8(255, 255, 255));

  for (var y = 0; y < matrix.height; y++) {
    for (var x = 0; x < matrix.width; x++) {
      if (matrix.get(x, y) != 1) continue;

      final left = (x + quietZone) * moduleSize;
      final top = (y + quietZone) * moduleSize;
      for (var dy = 0; dy < moduleSize; dy++) {
        for (var dx = 0; dx < moduleSize; dx++) {
          image.setPixelRgb(left + dx, top + dy, 0, 0, 0);
        }
      }
    }
  }

  return img.encodePng(image);
}
