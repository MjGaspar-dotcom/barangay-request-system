<?php

use Illuminate\Support\Facades\Route;

Route::get('/track-request', function () {
    $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
    $appUrl = rtrim((string) config('app.url'), '/');

    if ($frontendUrl === '' || $frontendUrl === $appUrl) {
        abort(503, 'Request tracking requires FRONTEND_URL to point to the frontend application.');
    }

    $query = http_build_query(request()->query());
    $trackingUrl = $frontendUrl.'/track-request'.($query === '' ? '' : '?'.$query);

    return redirect()->away($trackingUrl);
});

Route::get('/', function () {
    return view('welcome');
});
