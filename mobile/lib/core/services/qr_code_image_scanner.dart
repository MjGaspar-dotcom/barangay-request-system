import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:zxing2/qrcode.dart';

// zxing2 does not expose the detector or QR bit matrix through its public API.
// ignore: implementation_imports
import 'package:zxing2/src/common/bit_matrix.dart';
// ignore: implementation_imports
import 'package:zxing2/src/qrcode/detector/detector.dart';

class QrCodeImageScanner {
  static const _errorCorrectionBits = [1, 0, 3, 2];
  static const _formatInfoMask = 0x5412;
  static const _formatInfoPolynomial = 0x537;

  static String decode(Uint8List imageBytes) {
    final image = img.decodeImage(imageBytes);
    if (image == null) {
      throw const FormatException('The selected file is not a valid image.');
    }

    final pixels = image
        .convert(numChannels: 4)
        .getBytes(order: img.ChannelOrder.abgr)
        .buffer
        .asInt32List();
    final bitmap = BinaryBitmap(
      GlobalHistogramBinarizer(
        RGBLuminanceSource(image.width, image.height, pixels),
      ),
    );
    final reader = QRCodeReader();

    try {
      return reader.decode(bitmap).text;
    } on ReaderException {
      return _decodeWithFormatRepair(bitmap, reader);
    }
  }

  static String _decodeWithFormatRepair(
    BinaryBitmap bitmap,
    QRCodeReader reader,
  ) {
    final detectedBits =
        Detector(bitmap.getBlackMatrix()).detect(hints: DecodeHints()).bits;
    final payloads = <String>{};

    for (final errorCorrectionBits in _errorCorrectionBits) {
      for (var maskPattern = 0; maskPattern < 8; maskPattern++) {
        final bits = detectedBits.clone();
        _writeFormatInformation(
          bits,
          (errorCorrectionBits << 3) | maskPattern,
        );

        try {
          payloads.add(reader.decoder.decode(bits, hints: DecodeHints()).text);
        } on ReaderException {
          continue;
        }
      }
    }

    if (payloads.length == 1) {
      return payloads.single;
    }
    throw FormatReaderException();
  }

  static void _writeFormatInformation(BitMatrix bits, int data) {
    var remainder = data << 10;
    for (var bit = 14; bit >= 10; bit--) {
      if ((remainder & (1 << bit)) != 0) {
        remainder ^= _formatInfoPolynomial << (bit - 10);
      }
    }
    final formatInfo = ((data << 10) | remainder) ^ _formatInfoMask;

    for (var i = 0; i < 15; i++) {
      final value = (formatInfo & (1 << i)) != 0;
      if (i < 6) {
        _set(bits, 8, i, value);
      } else if (i < 8) {
        _set(bits, 8, i + 1, value);
      } else {
        _set(bits, 8, bits.height - 15 + i, value);
      }

      if (i < 8) {
        _set(bits, bits.width - i - 1, 8, value);
      } else if (i == 8) {
        _set(bits, 7, 8, value);
      } else {
        _set(bits, 15 - i - 1, 8, value);
      }
    }
  }

  static void _set(BitMatrix bits, int x, int y, bool value) {
    if (value) {
      bits.set(x, y);
    } else {
      bits.unset(x, y);
    }
  }
}
