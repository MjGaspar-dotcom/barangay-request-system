<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffOrAdmin
{
    /**
     * Only allow users who have a staff or admin relationship.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || (!$user->staff && !$user->admin)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Staff or Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
