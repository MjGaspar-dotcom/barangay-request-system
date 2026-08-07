<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBarangayRequest;
use App\Models\BarangayRequest;
use Illuminate\Support\Str;

class BarangayRequestController extends Controller
{
    /**
     * Store a newly created resource.
     */
    public function store(StoreBarangayRequest $request)
    {
        $data = $request->validated();

        /*
        |--------------------------------------------------------------------------
        | Upload Valid ID
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('guest_valid_id_image')) {

            $data['guest_valid_id_image'] = $request
                ->file('guest_valid_id_image')
                ->store('valid-ids', 'public');
        }

        /*
        |--------------------------------------------------------------------------
        | Generate Tracking Number
        |--------------------------------------------------------------------------
        */

        $data['tracking_number'] =
            'BRGY-' .
            now()->format('Y') .
            '-' .
            strtoupper(Str::random(6));

        /*
        |--------------------------------------------------------------------------
        | Default Status
        |--------------------------------------------------------------------------
        */

        $data['status'] = 'Pending';

        /*
        |--------------------------------------------------------------------------
        | Save Request
        |--------------------------------------------------------------------------
        */

        $barangayRequest = BarangayRequest::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Request submitted successfully.',
            'tracking_number' => $barangayRequest->tracking_number,
            'data' => $barangayRequest,
        ], 201);
    }
}