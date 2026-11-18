import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import 'package:barangay_mobile/core/utils/qr_image_decoder.dart';
import 'package:barangay_mobile/ui/widgets/qr_receipt_dialog.dart';

void main() {
  test('receipt QR PNG decodes to the tracking number', () {
    const trackingNumber = 'BR-20261117-8AZRRL';
    final pngBytes = QrReceiptDialog.trackingQrPng(trackingNumber);
    final image = img.decodePng(pngBytes);

    expect(image, isNotNull);
    expect(image!.width, 1024);
    expect(image.height, 1024);
    expect(decodeQrPayloadFromImage(image), trackingNumber);
    expect(decodeQrPayloadFromImageBytes(pngBytes), trackingNumber);
  });
}
