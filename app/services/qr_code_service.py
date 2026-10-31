from io import BytesIO
import qrcode
import qrcode.image.svg


class QrCodeService:
    @staticmethod
    def generate(value: str) -> str:
        output = BytesIO()
        image = qrcode.make(value, image_factory=qrcode.image.svg.SvgImage)
        image.save(output)
        return output.getvalue().decode("utf-8")
