<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Dunn\LaravelOcr\Facades\Ocr;
use App\Services\OcrParsingService;

class OcrTestController extends Controller
{
    public function test(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $imagePath = $request->file('image')->getRealPath();

        // Run Tesseract OCR engine
        $rawText = Ocr::image($imagePath)
            ->language('eng')
            ->run();

        // Parse extracted text into structured Philippine ID data
        $parsedData = OcrParsingService::parse($rawText);

        return response()->json([
            'success' => true,
            'data' => $parsedData,
        ]);
    }
}

