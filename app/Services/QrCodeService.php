<?php

namespace App\Services;

use Dunn\QrCode\Laravel\Facades\QrCode;

class QrCodeService
{
    /**
     * Generate a QR code as SVG.
     */
    public static function generate(string $trackingNumber): string
    {
        $trackingUrl = url("/api/track/{$trackingNumber}");

        return QrCode::svg($trackingUrl);
    }
}
    