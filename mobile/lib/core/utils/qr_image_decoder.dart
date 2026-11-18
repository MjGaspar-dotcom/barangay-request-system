import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:zxing2/qrcode.dart';

String decodeQrPayloadFromImageBytes(Uint8List imageBytes) {
  final decodedImage = img.decodeImage(imageBytes);
  if (decodedImage == null) {
    throw const FormatException('The selected file is not a valid image.');
  }

  final longestSide = decodedImage.width > decodedImage.height
      ? decodedImage.width
      : decodedImage.height;
  final image = longestSide > 512
      ? img.copyResize(
          decodedImage,
          width: (decodedImage.width * 512 / longestSide).round(),
          height: (decodedImage.height * 512 / longestSide).round(),
          interpolation: img.Interpolation.nearest,
        )
      : decodedImage;

  return decodeQrPayloadFromImage(image);
}

String decodeQrPayloadFromImage(img.Image image) {
  final luminances = Int8List(image.width * image.height);
  var index = 0;
  for (final pixel in image) {
    luminances[index++] = pixel.luminance.round();
  }
  final source = _ImageLuminanceSource(luminances, image.width, image.height);
  final hints = DecodeHints()..put(DecodeHintType.tryHarder);
  ReaderException? lastDecodeError;
  final binarizers = [
    HybridBinarizer(source),
    GlobalHistogramBinarizer(source),
    HybridBinarizer(source.invert()),
    GlobalHistogramBinarizer(source.invert()),
  ];

  for (final binarizer in binarizers) {
    try {
      return QRCodeReader().decode(BinaryBitmap(binarizer), hints: hints).text;
    } on ReaderException catch (error) {
      lastDecodeError = error;
    }
  }

  throw lastDecodeError ?? StateError('The QR code could not be decoded.');
}

class _ImageLuminanceSource extends LuminanceSource {
  final Int8List _luminances;

  _ImageLuminanceSource(this._luminances, super.width, super.height);

  @override
  Int8List getMatrix() => _luminances;

  @override
  Int8List getRow(int y, Int8List? row) {
    if (y < 0 || y >= height) {
      throw ArgumentError('Requested row is outside the image: $y');
    }

    final result = row == null || row.length < width ? Int8List(width) : row;
    result.setRange(0, width, _luminances, y * width);
    return result;
  }
}
