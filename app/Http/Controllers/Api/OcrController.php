<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OcrParsingService;
use Dunn\LaravelOcr\Facades\Ocr;
use Illuminate\Http\Request;

class OcrController extends Controller
{
    public function extract(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $imagePath = $request->file('image')->getRealPath();

        // Run Tesseract OCR engine
        $rawText = Ocr::image($imagePath)
            ->language((string) config('ocr.default_language', 'eng'))
            ->run();

        // Parse extracted text into structured Philippine ID data
        $parsedData = OcrParsingService::parse($rawText);

        return response()->json([
            'success' => true,
            'data' => $parsedData,
        ]);
    }
}
