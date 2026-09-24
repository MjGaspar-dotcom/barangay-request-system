<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Dunn\LaravelOcr\Facades\Ocr;

class OcrTestController extends Controller
{
    public function test(Request $request)
    {
        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $imagePath = $request->file('image')->getRealPath();

        $text = Ocr::image($imagePath)
            ->language('eng')
            ->run();
        preg_match('/Dob.*?(\d{2}-\d{2}-\d{4})/si', $text, $dateMatches);

        $birthDate = $dateMatches[1] ?? null;

        return response()->json([
            'success' => true,
            'text' => $text,
            'parsed' => [
                'birth_date' => $birthDate,
            ],
        ]);
    }
}
