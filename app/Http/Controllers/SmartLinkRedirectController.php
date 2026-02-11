<?php

namespace App\Http\Controllers;

use App\Models\SmartLink;
use App\Services\SmartLinks\SmartLinkRouter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SmartLinkRedirectController extends Controller
{
    public function __invoke(Request $request, SmartLink $smartLink, SmartLinkRouter $router): RedirectResponse
    {
        if (! $smartLink->is_active) {
            abort(404);
        }

        $result = $router->resolveAndTrack($smartLink, $request);

        $finalUrl = $result['final_url'] ?? null;
        if (! $finalUrl) {
            abort(404);
        }

        return redirect()->away($finalUrl);
    }
}
