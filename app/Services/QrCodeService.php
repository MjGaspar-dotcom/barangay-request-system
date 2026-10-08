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
        return QrCode::svg(self::payload($trackingNumber));
    }

    public static function payload(string $trackingNumber): string
    {
        return url('/api/track/'.rawurlencode($trackingNumber));
    }
}
