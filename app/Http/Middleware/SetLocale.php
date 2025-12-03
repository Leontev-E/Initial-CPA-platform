<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supported = ['ru', 'en'];
        $locale = $request->get('lang');

        if ($locale && in_array($locale, $supported, true)) {
            session(['locale' => $locale]);
        }

        $current = session('locale', config('app.locale'));
        app()->setLocale(in_array($current, $supported, true) ? $current : config('app.locale'));

        return $next($request);
    }
}
